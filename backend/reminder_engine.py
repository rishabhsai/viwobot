"""
reminder_engine.py — Reminder & Scheduled Alert System
--------------------------------------------------------
Uses APScheduler BackgroundScheduler to run reminder jobs.
Reminders are persisted to reminders.json and reloaded on startup.

Supported time formats:
  - Relative: "30m", "1h", "90s", "2h30m"
  - ISO 8601: "2025-06-01T14:30:00"

When a reminder fires:
  1. Speaks the message aloud via tts_client.speak()
  2. Broadcasts {"state": "reminder", "message": "..."} to all WS clients

Usage:
    from reminder_engine import reminder_engine
    rid = reminder_engine.add("Review flashcards", "30m")
    reminder_engine.list_reminders() → [...]
    reminder_engine.delete(rid)
"""

import json
import logging
import re
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.date import DateTrigger

logger = logging.getLogger(__name__)

REMINDERS_FILE = Path(__file__).parent / "reminders.json"


# ─── Time parsing ─────────────────────────────────────────────────────────────

def _parse_time(time_str: str) -> datetime:
    """
    Parse a relative or absolute time string into a UTC datetime.

    Relative examples:  "30m"  "1h"  "90s"  "2h30m"  "45 minutes"
    ISO 8601 examples:  "2025-06-01T14:30:00"  "2025-06-01T14:30:00+00:00"
    """
    time_str = time_str.strip()

    # Try ISO 8601 first
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%d %H:%M:%S"):
        try:
            dt = datetime.strptime(time_str, fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except ValueError:
            continue

    # Relative time (e.g. "30m", "1h30m", "90s", "45 minutes", "2 hours")
    total_seconds = 0
    # Match patterns like 2h, 30m, 45s, or word forms
    pattern = re.compile(
        r"(\d+)\s*(?:hours?|h)|(\d+)\s*(?:minutes?|mins?|m)|(\d+)\s*(?:seconds?|secs?|s)",
        re.IGNORECASE,
    )
    matches = pattern.findall(time_str)
    if matches:
        for h, m, s in matches:
            total_seconds += int(h or 0) * 3600
            total_seconds += int(m or 0) * 60
            total_seconds += int(s or 0)
        return datetime.now(tz=timezone.utc) + timedelta(seconds=total_seconds)

    # Plain integer seconds
    if time_str.isdigit():
        return datetime.now(tz=timezone.utc) + timedelta(seconds=int(time_str))

    raise ValueError(
        f"Cannot parse time '{time_str}'. "
        "Use a relative value like '30m', '1h', '90s', or an ISO 8601 string."
    )


# ─── ReminderEngine ───────────────────────────────────────────────────────────

class ReminderEngine:
    def __init__(self):
        self._scheduler = BackgroundScheduler(timezone="UTC")
        self._reminders: dict[str, dict] = {}  # id → reminder dict
        self._ws_manager = None   # set after import to avoid circular deps
        self._tts_speak = None    # set after import

    def init(self, ws_manager, tts_speak_fn):
        """
        Inject dependencies and start the scheduler.
        Call this once at application startup from main.py.
        """
        self._ws_manager = ws_manager
        self._tts_speak = tts_speak_fn
        self._scheduler.start()
        self._load_and_reschedule()
        logger.info("ReminderEngine started.")

    # ── Persistence ────────────────────────────────────────────────────────────

    def _save(self):
        """Write current reminders to reminders.json."""
        data = list(self._reminders.values())
        try:
            REMINDERS_FILE.write_text(
                json.dumps(data, indent=2, default=str), encoding="utf-8"
            )
        except OSError as exc:
            logger.error("Failed to save reminders: %s", exc)

    def _load_and_reschedule(self):
        """Load reminders.json and reschedule any future reminders."""
        if not REMINDERS_FILE.exists():
            return
        try:
            data = json.loads(REMINDERS_FILE.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            logger.warning("reminders.json is corrupt — skipping load.")
            return

        now = datetime.now(tz=timezone.utc)
        reloaded = 0
        for entry in data:
            fire_at = datetime.fromisoformat(entry["fire_at"])
            if fire_at.tzinfo is None:
                fire_at = fire_at.replace(tzinfo=timezone.utc)
            if fire_at <= now:
                logger.info("Skipping past reminder: %s", entry["message"])
                continue
            rid = entry["id"]
            self._reminders[rid] = entry
            self._schedule_job(rid, entry["message"], fire_at)
            reloaded += 1
        logger.info("Reloaded %d upcoming reminder(s) from disk.", reloaded)

    # ── Scheduling ─────────────────────────────────────────────────────────────

    def _schedule_job(self, rid: str, message: str, fire_at: datetime):
        """Add an APScheduler job for the given reminder."""
        self._scheduler.add_job(
            func=self._fire,
            trigger=DateTrigger(run_date=fire_at),
            args=[rid, message],
            id=rid,
            replace_existing=True,
        )

    def _fire(self, rid: str, message: str):
        """Called by APScheduler when a reminder is due."""
        logger.info("Reminder fired: %s", message)

        # Speak the reminder aloud
        if self._tts_speak:
            self._tts_speak(f"Reminder: {message}", blocking=False)

        # Push to WebSocket clients
        if self._ws_manager:
            self._ws_manager.broadcast_sync(
                {"state": "reminder", "message": message}
            )

        # Remove from in-memory store and disk
        self._reminders.pop(rid, None)
        self._save()

    # ── Public API ─────────────────────────────────────────────────────────────

    def add(self, message: str, time_str: str) -> dict:
        """
        Schedule a new reminder.

        Args:
            message:  Text to speak/display when the reminder fires.
            time_str: Relative ("30m") or ISO 8601 time string.

        Returns:
            The reminder dict with id, message, fire_at.
        """
        fire_at = _parse_time(time_str)
        rid = str(uuid.uuid4())
        entry = {
            "id": rid,
            "message": message,
            "fire_at": fire_at.isoformat(),
            "created_at": datetime.now(tz=timezone.utc).isoformat(),
        }
        self._reminders[rid] = entry
        self._schedule_job(rid, message, fire_at)
        self._save()
        logger.info("Reminder added: '%s' at %s (id=%s)", message, fire_at, rid)
        return entry

    def list_reminders(self) -> list[dict]:
        """Return all upcoming reminders sorted by fire time."""
        return sorted(self._reminders.values(), key=lambda r: r["fire_at"])

    def delete(self, rid: str) -> bool:
        """
        Cancel and remove a reminder by ID.

        Returns True if found and deleted, False if not found.
        """
        if rid not in self._reminders:
            return False
        try:
            self._scheduler.remove_job(rid)
        except Exception:
            pass  # Job may have already fired
        self._reminders.pop(rid, None)
        self._save()
        logger.info("Reminder deleted: id=%s", rid)
        return True

    def shutdown(self):
        """Gracefully stop the scheduler (call on app shutdown)."""
        self._scheduler.shutdown(wait=False)


# ─── Singleton ────────────────────────────────────────────────────────────────

reminder_engine = ReminderEngine()
