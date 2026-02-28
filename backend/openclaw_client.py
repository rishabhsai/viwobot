"""
openclaw_client.py — OpenClaw AI Brain
-----------------------------------------
Replaces gemini_client.py. Routes all AI inference through the locally-running
OpenClaw gateway (Node.js daemon) via the `openclaw agent` CLI.

OpenClaw is a model-agnostic personal AI assistant platform. It can use
Claude, OpenAI, Gemini, or any other configured backend — the choice is made
during `openclaw onboard`. Our Python backend does NOT care which model is
running; it just calls the CLI.

How it works:
  1. Each call invokes: `openclaw agent --message "..." --session-id viwobot-main --json`
  2. OpenClaw runs the agent, streams internally, then returns a JSON result
  3. We parse the reply text from stdout and log it locally to conversation.json

The Viwo Bot system prompt is injected as a leading instruction in every
message so OpenClaw's agent behaves as our assistant regardless of what
system prompt was configured during onboard.

Environment variables (from .env):
    OPENCLAW_SESSION_ID    — session key for conversation history (default: "viwobot-main")
    OPENCLAW_TIMEOUT       — seconds to wait for a reply (default: 60)
    OPENCLAW_THINKING      — thinking level: off|minimal|low|medium|high|xhigh (default: off)
"""

import json
import logging
import os
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# ─── Constants ────────────────────────────────────────────────────────────────

HISTORY_FILE = Path(__file__).parent / "conversation.json"

# Session ID that OpenClaw uses to maintain conversation context internally.
# All Viwo Bot chat goes through this single session.
SESSION_ID = os.getenv("OPENCLAW_SESSION_ID", "viwobot-main")
# Persistent session for isolated eval calls (tutor questions/scoring).
# Reusing a fixed session means the 87K system context is cached after the first call.
EVAL_SESSION_ID = os.getenv("OPENCLAW_EVAL_SESSION_ID", "viwobot-eval")
TIMEOUT = int(os.getenv("OPENCLAW_TIMEOUT", "60"))
THINKING = os.getenv("OPENCLAW_THINKING", "off")

# Short prefix — OpenClaw already loads Nova's persona from SOUL.md/IDENTITY.md
# configured during onboard. This just reinforces concise voice-style replies.
VIWO_SYSTEM_PREFIX = "Reply in 1-3 short conversational sentences as Nova, a voice AI assistant. Message: "


# ─── Startup check ────────────────────────────────────────────────────────────

def _check_openclaw():
    """Verify that the `openclaw` CLI is available in PATH. Raises if not."""
    if shutil.which("openclaw") is None:
        raise EnvironmentError(
            "❌  `openclaw` CLI not found in PATH.\n"
            "To fix this:\n"
            "  1. Install Node.js ≥ 22  →  https://nodejs.org\n"
            "  2. Install OpenClaw:      npm install -g openclaw@latest\n"
            "  3. Run the wizard:        openclaw onboard --install-daemon\n"
            "  4. Confirm it works:      openclaw agent --message 'hi' --json\n"
            "Then restart the Viwo Bot backend."
        )
    logger.info("openclaw CLI found at: %s", shutil.which("openclaw"))


# ─── History helpers ──────────────────────────────────────────────────────────

def _load_history() -> list[dict]:
    """Load local conversation log from conversation.json."""
    if not HISTORY_FILE.exists():
        return []
    try:
        data = json.loads(HISTORY_FILE.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except (json.JSONDecodeError, OSError):
        logger.warning("conversation.json unreadable — starting fresh.")
        return []


def _save_history(history: list[dict]):
    """Persist conversation log to conversation.json."""
    try:
        HISTORY_FILE.write_text(
            json.dumps(history, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
    except OSError as exc:
        logger.error("Failed to save conversation history: %s", exc)


# ─── CLI invocation ───────────────────────────────────────────────────────────

def _run_openclaw(message: str, session_id: str = SESSION_ID) -> str:
    """
    Invoke `openclaw agent --message ... --json` as a subprocess.

    Args:
        message:    The full message text to send to the OpenClaw agent.
        session_id: The session key. Use SESSION_ID for main chat, a unique
                    ID for isolated eval calls (tutor evaluation prompts).

    Returns:
        The agent's reply text as a string.

    Raises:
        RuntimeError: If the CLI exits with a non-zero code or returns no reply.
    """
    cmd = [
        "openclaw", "agent",
        "--message", message,
        "--session-id", session_id,
        "--thinking", THINKING,
        "--json",
    ]
    logger.debug("openclaw cmd: %s", " ".join(cmd[:6]) + " ...")

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=TIMEOUT,
        )
    except subprocess.TimeoutExpired:
        raise RuntimeError(
            f"openclaw agent timed out after {TIMEOUT}s. "
            "Try increasing OPENCLAW_TIMEOUT in your .env."
        )
    except FileNotFoundError:
        raise RuntimeError(
            "openclaw CLI not found. Run: npm install -g openclaw@latest"
        )

    if result.returncode != 0:
        err = result.stderr.strip() or result.stdout.strip()
        raise RuntimeError(f"openclaw agent failed (exit {result.returncode}): {err}")

    # Parse JSON output — openclaw --json returns a structured payload.
    # The reply text lives at .reply (text content of the agent's response).
    raw_output = result.stdout.strip()
    if not raw_output:
        raise RuntimeError("openclaw agent returned empty output.")

    try:
        data = json.loads(raw_output)
    except json.JSONDecodeError:
        # Not JSON — return raw as-is
        logger.warning("openclaw output was not JSON — using raw text.")
        return raw_output.strip()

    # Walk the OpenClaw JSON response tree.
    # Standard agent run response: { status, result: { payloads: [{text, mediaUrl}] } }
    try:
        payloads = data.get("result", {}).get("payloads", [])
        if payloads:
            text = payloads[0].get("text", "").strip()
            if text:
                # Strip any error/rate-limit notices and return
                logger.debug("OpenClaw reply (payloads[0].text): %s", text[:80])
                return text
    except (KeyError, IndexError, TypeError):
        pass

    # Fallback: check common top-level reply keys
    for key in ("reply", "text", "response", "content", "message"):
        if key in data and data[key]:
            return str(data[key]).strip()

    # Last resort — log the keys we got so we can debug
    logger.warning("Could not extract reply from openclaw JSON keys: %s", list(data.keys()))
    return "Sorry, I had trouble getting a response. Please try again."


# ─── OpenClawClient ───────────────────────────────────────────────────────────

class OpenClawClient:
    """
    Drop-in replacement for GeminiClient.
    Exposes the same interface so tutor_engine, main.py, etc. need no changes
    beyond the import path.
    """

    def __init__(self):
        _check_openclaw()
        self._history: list[dict] = _load_history()
        logger.info(
            "OpenClawClient ready. Session: %s | Loaded %d prior messages.",
            SESSION_ID,
            len(self._history),
        )

    def chat(self, message: str) -> str:
        """
        Send a user message through OpenClaw and return the reply.
        Appends both sides to the local history log.
        """
        full_message = VIWO_SYSTEM_PREFIX + message
        reply = _run_openclaw(full_message, session_id=SESSION_ID)

        now = datetime.now(tz=timezone.utc).isoformat()
        self._history.append({"role": "user",  "content": message, "timestamp": now})
        self._history.append({"role": "model", "content": reply,   "timestamp": now})
        _save_history(self._history)

        logger.debug("OpenClaw replied: %s", reply[:80])
        return reply

    def chat_raw(self, message: str) -> str:
        """
        Like chat() but uses a dedicated persistent eval session (viwobot-eval)
        instead of ephemeral one-off sessions.

        Using a persistent session means the 87K system context is loaded ONCE
        and Gemini caches it on subsequent calls — drastically cheaper than
        spawning a fresh session (full context load) on every tutor question.

        Does NOT write to the main conversation history.
        """
        return _run_openclaw(message, session_id=EVAL_SESSION_ID)

    def get_history(self) -> list[dict]:
        """Return the full conversation log."""
        return self._history

    def clear_history(self):
        """Wipe local conversation history. (OpenClaw's own session persists separately.)"""
        self._history = []
        _save_history(self._history)
        logger.info("Local conversation history cleared.")


# ─── Module-level singleton ───────────────────────────────────────────────────

# Named `gemini` intentionally so existing imports (from gemini_client import gemini)
# continue to work without any changes in other modules — just change the import path.
openclaw = OpenClawClient()

# Backward-compat alias used in main.py and tutor_engine.py
gemini = openclaw
