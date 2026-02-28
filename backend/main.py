"""
main.py — FastAPI Entrypoint for Viwo Bot Backend
--------------------------------------------------
Mounts all routes and WebSocket endpoints. Starts background services
(wake-word pipeline, APScheduler) on startup and cleanly shuts them down.

Endpoints:
  POST /chat                   → chat with Viwo Bot
  GET  /history                → full conversation history
  POST /tutor/start            → start a tutoring session
  GET  /tutor/score            → current session score
  POST /tutor/end              → end the session
  POST /tutor/answer           → submit an answer (for HTTP-based testing)
  POST /reminders              → create a reminder
  GET  /reminders              → list upcoming reminders
  DELETE /reminders/{id}       → cancel a reminder
  WS   /ws/status              → live state broadcast to frontend
  WS   /ws/mic                 → browser/phone mic PCM stream → STT → route

CORS: allowed for http://localhost:3000 (Next.js frontend)
"""

import asyncio
import json
import logging
import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

# ─── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

# ─── Initialise data files if missing ─────────────────────────────────────────
BASE_DIR = Path(__file__).parent

def _init_json(path: Path):
    if not path.exists():
        path.write_text("[]", encoding="utf-8")
        logger.info("Created %s", path.name)

_init_json(BASE_DIR / "conversation.json")
_init_json(BASE_DIR / "tutor_sessions.json")
_init_json(BASE_DIR / "reminders.json")
_init_json(BASE_DIR / "memories.json")

# ─── Import singletons ────────────────────────────────────────────────────────
# Import order matters: ws_manager first (no deps), then clients that use it.
from ws_manager import manager as ws_manager
# AI brain: OpenClaw gateway (Node.js, model-agnostic — Claude/OpenAI/Gemini/etc.)
# openclaw_client exposes a `gemini` backward-compat alias so no other code changes.
from openclaw_client import gemini
from tts_client import speak
from reminder_engine import reminder_engine
from tutor_engine import tutor_engine
import voice_pipeline


# ─── Lifespan (startup / shutdown) ───────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup: store the running event loop in ws_manager so background threads
    can schedule WS broadcasts via asyncio.run_coroutine_threadsafe().
    Then initialise engines and start the voice pipeline thread.
    """
    loop = asyncio.get_running_loop()
    ws_manager.set_loop(loop)

    # Wire up dependencies
    reminder_engine.init(ws_manager=ws_manager, tts_speak_fn=speak)
    tutor_engine.init(
        gemini_client=gemini,
        tts_speak_fn=speak,
        ws_manager=ws_manager,
    )

    # Start wake-word pipeline in background thread
    voice_pipeline.start_pipeline(
        ws_manager=ws_manager,
        gemini_client=gemini,
        tts_speak_fn=speak,
        reminder_engine=reminder_engine,
        tutor_engine=tutor_engine,
    )

    logger.info("✅ Viwo Bot backend is ready.")
    yield

    # Shutdown
    voice_pipeline.stop_pipeline()
    reminder_engine.shutdown()
    logger.info("Viwo Bot backend shutdown complete.")


# ─── FastAPI app ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="Viwo Bot API",
    description="Voice-activated AI personal assistant backend.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174", "http://localhost:5175", "http://127.0.0.1:5175"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request / Response models ────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str
    timestamp: str


class TutorStartRequest(BaseModel):
    topic: str
    notes: Optional[str] = ""


class TutorAnswerRequest(BaseModel):
    answer: str


class ReminderRequest(BaseModel):
    message: str
    time: str  # ISO 8601 or relative ("30m", "1h", "90s")


class AutomationRequest(BaseModel):
    prompt: str


# ─── Chat endpoints ───────────────────────────────────────────────────────────

@app.post("/chat", response_model=ChatResponse, tags=["Chat"])
async def chat(request: ChatRequest):
    """
    Send a message to Viwo Bot and get a response.
    Also speaks the response aloud and broadcasts WS state.
    """
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    await ws_manager.broadcast({"state": "thinking", "transcript": request.message})

    # Run Gemini in a thread pool to avoid blocking the event loop
    loop = asyncio.get_running_loop()
    response_text = await loop.run_in_executor(None, gemini.chat, request.message)

    await ws_manager.broadcast({"state": "speaking", "response": response_text})

    # Speak the response asynchronously (non-blocking)
    loop.run_in_executor(None, lambda: speak(response_text, blocking=True))

    return ChatResponse(
        response=response_text,
        timestamp=datetime.now(tz=timezone.utc).isoformat(),
    )


@app.get("/history", tags=["Chat"])
async def get_history():
    """Return the full conversation history."""
    return {"history": gemini.get_history()}


# ─── Tutor endpoints ──────────────────────────────────────────────────────────

@app.post("/tutor/start", tags=["Tutor"])
async def tutor_start(request: TutorStartRequest):
    """
    Begin a tutoring session. Optionally include study notes/syllabus as plain text.
    The session runs asynchronously — questions are delivered via TTS and /ws/status.
    """
    if not request.topic.strip():
        raise HTTPException(status_code=400, detail="Topic cannot be empty.")

    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(
        None, tutor_engine.start, request.topic, request.notes or ""
    )
    return result


@app.get("/tutor/score", tags=["Tutor"])
async def tutor_score():
    """Return the current tutoring session's score and state."""
    score = tutor_engine.get_score()
    if score is None:
        raise HTTPException(status_code=404, detail="No active tutor session.")
    return score


@app.post("/tutor/answer", tags=["Tutor"])
async def tutor_answer(request: TutorAnswerRequest):
    """
    Submit a typed answer for the current tutor question.
    Useful for testing without a mic, or for the frontend text input.
    """
    if tutor_engine.active_session is None:
        raise HTTPException(status_code=404, detail="No active tutor session.")

    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(
        None, tutor_engine.answer, request.answer
    )
    return result


@app.post("/tutor/end", tags=["Tutor"])
async def tutor_end():
    """End the current tutoring session and save the summary."""
    score = tutor_engine.end()
    if score is None:
        raise HTTPException(status_code=404, detail="No active tutor session.")
    return {"status": "ended", "score": score}


# ─── Reminder endpoints ───────────────────────────────────────────────────────

@app.post("/reminders", tags=["Reminders"], status_code=201)
async def create_reminder(request: ReminderRequest):
    """
    Schedule a reminder.

    time field accepts:
      - Relative: "30m", "1h", "90s"
      - ISO 8601: "2025-06-01T14:30:00"
    """
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    try:
        entry = reminder_engine.add(message=request.message, time_str=request.time)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    return entry


@app.get("/reminders", tags=["Reminders"])
async def list_reminders():
    """List all upcoming reminders sorted by scheduled time."""
    return {"reminders": reminder_engine.list_reminders()}


@app.delete("/reminders/{reminder_id}", tags=["Reminders"])
async def delete_reminder(reminder_id: str):
    """Cancel and delete a reminder by its ID."""
    deleted = reminder_engine.delete(reminder_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Reminder not found.")
    return {"status": "deleted", "id": reminder_id}


# ─── Memory endpoints ─────────────────────────────────────────────────────────

MEMORIES_FILE = BASE_DIR / "memories.json"

@app.get("/memories", tags=["Memories"])
async def list_memories():
    """Return all stored memories."""
    try:
        data = json.loads(MEMORIES_FILE.read_text(encoding="utf-8"))
    except Exception:
        data = []
    return {"memories": data}


@app.post("/memories", tags=["Memories"], status_code=201)
async def add_memory(memory: dict):
    """Add a new memory."""
    try:
        data = json.loads(MEMORIES_FILE.read_text(encoding="utf-8"))
    except Exception:
        data = []
    memory["id"] = f"mem-{uuid.uuid4().hex[:8]}"
    data.append(memory)
    MEMORIES_FILE.write_text(json.dumps(data, indent=4), encoding="utf-8")
    return memory


# ─── Automation endpoints ──────────────────────────────────────────────────────

@app.post("/automations/generate", tags=["Automations"])
async def generate_automation(request: AutomationRequest):
    """
    Generate an automation layout from a text prompt using the LLM.
    """
    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")

    system_prompt = (
        "You are an AI assistant that extracts automation workflows from user requests. "
        "Return ONLY a raw JSON object with no markdown formatting or extra text. "
        "The object must have exactly these keys: "
        "'title' (string), 'description' (string), 'trigger' (string), "
        "and 'steps' (array of objects, each with 'action' string and 'target' string). "
        f"The user request is: {request.prompt}"
    )

    loop = asyncio.get_running_loop()
    # Use gemini.chat_raw to avoid mixing with main conversation history
    reply_text = await loop.run_in_executor(None, gemini.chat_raw, system_prompt)

    text = reply_text.strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()

    try:
        data = json.loads(text)
    except Exception as e:
        logger.error(f"Failed to parse automation JSON: {e} | Raw text: {reply_text}")
        raise HTTPException(status_code=500, detail="Failed to parse automation logic.")

    automation_id = uuid.uuid4().hex[:8]
    steps = data.get("steps", [])
    for step in steps:
        step["id"] = uuid.uuid4().hex[:8]
    
    return {
        "id": automation_id,
        "title": data.get("title", "New Automation Workflow"),
        "description": data.get("description", ""),
        "trigger": data.get("trigger", "Manual"),
        "steps": steps
    }


# ─── WebSocket: live status ───────────────────────────────────────────────────

@app.websocket("/ws/status")
async def ws_status(websocket: WebSocket):
    """
    Live state broadcast WebSocket.
    Connect from the frontend to receive real-time state updates:
      {"state": "idle"}
      {"state": "listening"}
      {"state": "thinking", "transcript": "..."}
      {"state": "speaking", "response": "..."}
      {"state": "tutor_question", "question": "...", "topic": "...", "index": N}
      {"state": "tutor_feedback", "correct": true/false, "explanation": "..."}
      {"state": "reminder", "message": "..."}
    """
    await ws_manager.connect(websocket)
    # Send initial idle state
    await websocket.send_text(json.dumps({"state": "idle"}))
    try:
        while True:
            # Keep connection alive; the dashboard only receives, doesn't send here
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)


# ─── WebSocket: browser/phone mic ────────────────────────────────────────────

@app.websocket("/ws/mic")
async def ws_mic(websocket: WebSocket):
    """
    Browser/phone mic input WebSocket.
    Send raw PCM audio frames (16-bit, 16 kHz, mono) as binary messages.
    Send "END" text message to trigger transcription and routing.
    See voice_pipeline.handle_mic_websocket for protocol details.
    """
    await voice_pipeline.handle_mic_websocket(
        websocket=websocket,
        ws_manager=ws_manager,
        gemini_client=gemini,
        tts_speak_fn=speak,
        reminder_engine=reminder_engine,
        tutor_engine=tutor_engine,
    )


# ─── Health check ─────────────────────────────────────────────────────────────

@app.get("/health", tags=["System"])
async def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "timestamp": datetime.now(tz=timezone.utc).isoformat(),
        "active_ws_clients": len(ws_manager.active_connections),
    }


# ─── Dev runner ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
