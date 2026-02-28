"""
tutor_engine.py — Voice-Interactive Tutor Mode
------------------------------------------------
Manages a full tutoring session:

1. Ingest study notes/syllabus (plain text) via Gemini → extract key concepts
2. Run a Q&A loop:
     a. Pick a concept → generate a question via Gemini → speak it (TTS)
     b. Wait for user's spoken/typed answer
     c. Evaluate the answer via Gemini → give feedback (TTS)
     d. Update score + track weak areas
3. Re-test weak areas at the end
4. Save session summary to tutor_sessions.json

State machine:
  IDLE → ACTIVE (on start)
  ACTIVE → ASKING → AWAITING_ANSWER → EVALUATING → ASKING (loop)
  ACTIVE → IDLE (on end)

WebSocket events emitted:
  {"state": "tutor_question", "question": "...", "topic": "...", "index": N}
  {"state": "tutor_feedback", "correct": true/false, "explanation": "..."}
"""

import json
import logging
import threading
import uuid
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

SESSIONS_FILE = Path(__file__).parent / "tutor_sessions.json"


class TutorState(str, Enum):
    IDLE = "idle"
    ACTIVE = "active"
    ASKING = "asking"
    AWAITING_ANSWER = "awaiting_answer"
    EVALUATING = "evaluating"
    FINISHED = "finished"


class TutorSession:
    """
    Encapsulates one tutoring session for a given topic.
    Thread-safe: the voice pipeline and HTTP endpoints both interact with it.
    """

    def __init__(
        self,
        topic: str,
        notes: str,
        gemini_client,
        tts_speak_fn,
        ws_manager,
    ):
        self.session_id = str(uuid.uuid4())
        self.topic = topic
        self.notes = notes
        self._gemini = gemini_client
        self._speak = tts_speak_fn
        self._ws = ws_manager

        self.state = TutorState.IDLE
        self._lock = threading.Lock()

        # Q&A tracking
        self.concepts: list[str] = []          # Extracted from notes
        self.q_index: int = 0
        self.current_question: str = ""
        self.current_concept: str = ""
        self.correct: int = 0
        self.incorrect: int = 0
        self.weak_topics: list[str] = []
        self.strong_topics: list[str] = []
        self.exchange_log: list[dict] = []     # Full Q&A log for the dashboard
        self.difficulty: int = 1               # 1=easy, 2=medium, 3=hard

        self.started_at: str = datetime.now(tz=timezone.utc).isoformat()
        self.ended_at: Optional[str] = None

    # ── Concept extraction ────────────────────────────────────────────────────

    def extract_concepts(self):
        """
        Ask Gemini to extract key concepts from the notes.
        Returns a list of concept strings (stored in self.concepts).
        """
        prompt = (
            f"The following are study notes on the topic: '{self.topic}'.\n\n"
            f"{self.notes}\n\n"
            "Extract the 8–12 most important concepts or facts from these notes. "
            "Return ONLY a JSON array of short concept strings, e.g.: "
            '["Concept 1", "Concept 2", ...]. No explanation.'
        )
        try:
            raw = self._gemini.chat_raw(prompt)
            # Strip markdown code fences if present
            raw = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
            concepts = json.loads(raw)
            if isinstance(concepts, list):
                self.concepts = [str(c) for c in concepts if c]
                logger.info(
                    "Extracted %d concepts for topic '%s'.", len(self.concepts), self.topic
                )
                return self.concepts
        except (json.JSONDecodeError, Exception) as exc:
            logger.error("Concept extraction failed: %s", exc)

        # Fallback: treat whole notes as a single concept block
        self.concepts = [self.topic]
        return self.concepts

    # ── Question generation ───────────────────────────────────────────────────

    def _generate_question(self, concept: str) -> str:
        """Ask Gemini to generate a tutoring question about the concept."""
        difficulty_labels = {1: "simple recall", 2: "understanding", 3: "application"}
        difficulty_label = difficulty_labels.get(self.difficulty, "understanding")

        prompt = (
            f"You are tutoring a student on '{self.topic}'. "
            f"Ask a single, clear, concise {difficulty_label} question about: '{concept}'. "
            "Ask ONLY the question — no preamble, no explanation."
        )
        return self._gemini.chat_raw(prompt).strip().strip('"')

    # ── Answer evaluation ─────────────────────────────────────────────────────

    def evaluate_answer(self, user_answer: str) -> dict:
        """
        Evaluate the user's answer against the current concept.
        Updates score, difficulty, weak/strong topic lists, and WS state.
        Returns {"correct": bool, "explanation": str}.
        """
        with self._lock:
            if self.state != TutorState.AWAITING_ANSWER:
                return {"correct": False, "explanation": "No active question."}

            self.state = TutorState.EVALUATING

        concept = self.current_concept
        question = self.current_question

        prompt = (
            f"Topic: '{self.topic}'. Concept tested: '{concept}'.\n"
            f"Question asked: {question}\n"
            f"Student's answer: {user_answer}\n\n"
            "Evaluate the answer. Reply with a strict JSON object (no markdown): "
            '{"correct": true/false, "explanation": "1–2 sentence feedback, '
            'simple analogy if wrong"}. No extra text.'
        )
        try:
            raw = self._gemini.chat_raw(prompt)
            raw = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
            result = json.loads(raw)
            correct: bool = bool(result.get("correct", False))
            explanation: str = result.get("explanation", "")
        except Exception as exc:
            logger.error("Evaluation failed: %s", exc)
            correct = False
            explanation = "I had trouble evaluating that. Let's move on."

        # Update score
        with self._lock:
            if correct:
                self.correct += 1
                self.strong_topics.append(concept)
                # Increase difficulty if doing well
                if self.difficulty < 3:
                    self.difficulty += 1
            else:
                self.incorrect += 1
                if concept not in self.weak_topics:
                    self.weak_topics.append(concept)
                # Decrease difficulty to re-explain simpler
                if self.difficulty > 1:
                    self.difficulty -= 1

            self.exchange_log.append(
                {
                    "concept": concept,
                    "question": question,
                    "user_answer": user_answer,
                    "correct": correct,
                    "explanation": explanation,
                    "timestamp": datetime.now(tz=timezone.utc).isoformat(),
                }
            )

        # Broadcast feedback to dashboard
        self._ws.broadcast_sync(
            {
                "state": "tutor_feedback",
                "correct": correct,
                "explanation": explanation,
            }
        )

        # Speak feedback aloud
        feedback_text = (
            f"{'Correct! ' if correct else 'Not quite. '}{explanation}"
        )
        self._speak(feedback_text, blocking=True)

        # Advance to next question or finish
        with self._lock:
            self.q_index += 1
            remaining = self._get_next_concepts()
            self.state = TutorState.ACTIVE

        # Auto-advance to next question
        if remaining:
            self.ask_next_question()
        else:
            self._finish()

        return {"correct": correct, "explanation": explanation}

    # ── Q&A loop ──────────────────────────────────────────────────────────────

    def _get_next_concepts(self) -> list[str]:
        """
        Returns remaining concepts, appending weak topics at the end for re-testing.
        """
        base = list(self.concepts[self.q_index:])
        # Append weak topics for re-testing (deduplicated)
        for wt in self.weak_topics:
            if wt not in base:
                base.append(wt)
        return base

    def ask_next_question(self):
        """
        Pick the next concept, generate a question, speak it, and update WS state.
        Called automatically after each answered question and at session start.
        """
        with self._lock:
            remaining = self._get_next_concepts()
            if not remaining:
                self._finish()
                return
            concept = remaining[0]
            self.current_concept = concept
            self.state = TutorState.ASKING

        question = self._generate_question(concept)

        with self._lock:
            self.current_question = question
            self.state = TutorState.AWAITING_ANSWER

        # Broadcast question to dashboard
        self._ws.broadcast_sync(
            {
                "state": "tutor_question",
                "question": question,
                "topic": concept,
                "index": self.q_index,
            }
        )

        # Speak the question
        self._speak(question, blocking=True)

    def _finish(self):
        """Wrap up the session and save summary to disk."""
        self.state = TutorState.FINISHED
        self.ended_at = datetime.now(tz=timezone.utc).isoformat()

        summary_text = (
            f"Great work! You answered {self.correct} questions correctly "
            f"and {self.incorrect} incorrectly. "
        )
        if self.weak_topics:
            summary_text += (
                f"You should review: {', '.join(self.weak_topics[:3])}."
            )
        else:
            summary_text += "You nailed every topic!"

        self._speak(summary_text, blocking=False)
        self._ws.broadcast_sync({"state": "idle"})
        self._save_session()

    def _save_session(self):
        """Append session summary to tutor_sessions.json."""
        summary = {
            "session_id": self.session_id,
            "topic": self.topic,
            "started_at": self.started_at,
            "ended_at": self.ended_at,
            "correct": self.correct,
            "incorrect": self.incorrect,
            "weak_topics": self.weak_topics,
            "strong_topics": self.strong_topics,
            "exchange_log": self.exchange_log,
        }
        existing: list = []
        if SESSIONS_FILE.exists():
            try:
                existing = json.loads(SESSIONS_FILE.read_text(encoding="utf-8"))
            except (json.JSONDecodeError, OSError):
                existing = []
        existing.append(summary)
        try:
            SESSIONS_FILE.write_text(
                json.dumps(existing, indent=2, ensure_ascii=False), encoding="utf-8"
            )
            logger.info("Tutor session saved: %s", self.session_id)
        except OSError as exc:
            logger.error("Failed to save tutor session: %s", exc)

    # ── Score API ─────────────────────────────────────────────────────────────

    def get_score(self) -> dict:
        return {
            "session_id": self.session_id,
            "topic": self.topic,
            "state": self.state.value,
            "correct": self.correct,
            "incorrect": self.incorrect,
            "weak_topics": self.weak_topics,
            "strong_topics": self.strong_topics,
            "q_index": self.q_index,
            "total_concepts": len(self.concepts),
        }


# ─── TutorEngine (session manager) ───────────────────────────────────────────

class TutorEngine:
    """
    Manages the lifecycle of tutor sessions.
    Only one session runs at a time.
    """

    def __init__(self):
        self._session: Optional[TutorSession] = None
        self._gemini = None
        self._speak = None
        self._ws = None

    def init(self, gemini_client, tts_speak_fn, ws_manager):
        """Inject shared dependencies. Call once at startup from main.py."""
        self._gemini = gemini_client
        self._speak = tts_speak_fn
        self._ws = ws_manager

    def start(self, topic: str, notes: str = "") -> dict:
        """
        Begin a new tutoring session (ends any current session first).

        Args:
            topic: The subject to study (e.g. "Python decorators").
            notes: Optional study notes/syllabus text to ingest.

        Returns:
            dict with session_id and extracted concepts.
        """
        if self._session and self._session.state not in (
            TutorState.IDLE, TutorState.FINISHED
        ):
            self._session._finish()

        session = TutorSession(
            topic=topic,
            notes=notes,
            gemini_client=self._gemini,
            tts_speak_fn=self._speak,
            ws_manager=self._ws,
        )
        self._session = session
        session.state = TutorState.ACTIVE

        # Extract concepts in background thread (non-blocking for HTTP response)
        def _start_session():
            intro = f"Let's study {topic}! I'll ask you some questions."
            self._speak(intro, blocking=True)

            if notes.strip():
                session.extract_concepts()
            else:
                # Generate concepts from topic name alone
                session.notes = f"Topic: {topic}"
                session.extract_concepts()

            session.ask_next_question()

        t = threading.Thread(target=_start_session, daemon=True)
        t.start()

        return {
            "session_id": session.session_id,
            "topic": topic,
            "status": "started",
        }

    def get_score(self) -> Optional[dict]:
        if not self._session:
            return None
        return self._session.get_score()

    def answer(self, user_answer: str) -> Optional[dict]:
        """Submit an answer for the current question. Returns evaluation."""
        if not self._session:
            return None
        return self._session.evaluate_answer(user_answer)

    def end(self) -> Optional[dict]:
        """Manually end the current session."""
        if not self._session:
            return None
        self._session._finish()
        score = self._session.get_score()
        return score

    @property
    def active_session(self) -> Optional[TutorSession]:
        return self._session


# ─── Singleton ────────────────────────────────────────────────────────────────

tutor_engine = TutorEngine()
