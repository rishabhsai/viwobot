# Viwo Bot — Backend

Voice-activated AI personal assistant backend. Built with **FastAPI + Python 3.11**, powered by **OpenClaw** (model-agnostic AI gateway — Claude, OpenAI, Gemini, etc.), with **ElevenLabs TTS**, **Porcupine wake word**, and **APScheduler reminders**.

---

## 🚀 Quick Start

### 1. Prerequisites

#### Python
- Python 3.11+
- macOS/Linux/Windows (WSL2 on Windows recommended for audio)
- PortAudio (required by PyAudio / sounddevice):
  - **macOS**: `brew install portaudio`
  - **Ubuntu/Debian**: `sudo apt install portaudio19-dev`
  - **Windows**: included in PyAudio wheels — no extra step

#### OpenClaw (AI Brain — required)
OpenClaw is the model-agnostic AI engine that handles all chat, tutoring evaluation, and concept extraction. It runs as a local Node.js daemon.

```bash
# 1. Install Node.js ≥ 22 → https://nodejs.org
# 2. Install OpenClaw globally
npm install -g openclaw@latest

# 3. Run the onboarding wizard — choose your model backend here
#    (Claude Pro/Max, OpenAI, Gemini, etc.)
openclaw onboard --install-daemon

# 4. Verify it works
openclaw agent --message "Hello, are you working?" --json
```

> The OpenClaw gateway daemon must be **running** when you start the Viwo Bot backend.
> It's installed as a background service by `--install-daemon` and auto-starts on login.

### 2. Set up virtual environment

```bash
cd /path/to/viwobot/backend
python3.11 -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure API keys

```bash
cp .env.example .env
```

Edit `.env` and fill in your keys:

| Key | Details | Required? |
|-----|---------|-----------|
| `OPENCLAW_SESSION_ID` | Session key for conversation context (default: `viwobot-main`) | ❌ Optional (has default) |
| `OPENCLAW_TIMEOUT` | Seconds to wait for OpenClaw reply (default: `60`) | ❌ Optional |
| `OPENCLAW_THINKING` | Thinking level for supported models (default: `off`) | ❌ Optional |
| `ELEVENLABS_API_KEY` | [elevenlabs.io](https://elevenlabs.io) → Profile → API Keys | ❌ Optional (falls back to pyttsx3 offline TTS) |
| `PORCUPINE_ACCESS_KEY` | [console.picovoice.ai](https://console.picovoice.ai) | ❌ Optional (disables mic wake word) |

### 4. Run the server

```bash
uvicorn main:app --reload --port 8000
```

The API will be available at **http://localhost:8000**.

The interactive API docs are at **http://localhost:8000/docs**.

---

## 🎤 Wake Word Setup

The wake word currently uses Porcupine's built-in **"hey google"** as a placeholder for "Hey Viwo".

### To train a FREE custom "Hey Viwo" keyword:
1. Go to [console.picovoice.ai](https://console.picovoice.ai/) → **Custom Wake Word**
2. Type `Hey Viwo` and click **Train**
3. Download the `.ppn` file
4. Set `PORCUPINE_KEYWORD_PATH=/path/to/hey-viwo.ppn` in your `.env`

---

## 🌐 API Reference

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/chat` | Send a message → get Viwo's response |
| `GET` | `/history` | Return full conversation log |

**POST /chat** — request body:
```json
{ "message": "What's the weather like?" }
```
Response:
```json
{ "response": "I don't have live weather data, but...", "timestamp": "2025-06-01T12:00:00+00:00" }
```

### Tutor Mode

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/tutor/start` | Begin tutoring session with optional study notes |
| `GET` | `/tutor/score` | Current session score |
| `POST` | `/tutor/answer` | Submit a typed answer (no mic needed) |
| `POST` | `/tutor/end` | End session, save summary |

**POST /tutor/start** — request body:
```json
{
  "topic": "Python Decorators",
  "notes": "A decorator is a function that wraps another function..."
}
```

**GET /tutor/score** — response:
```json
{
  "session_id": "...",
  "topic": "Python Decorators",
  "state": "awaiting_answer",
  "correct": 3,
  "incorrect": 1,
  "weak_topics": ["closures"],
  "strong_topics": ["def keyword", "return values"],
  "q_index": 4,
  "total_concepts": 8
}
```

### Reminders

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/reminders` | Schedule a reminder |
| `GET` | `/reminders` | List upcoming reminders |
| `DELETE` | `/reminders/{id}` | Cancel a reminder |

**POST /reminders** — request body:
```json
{ "message": "Review flashcards", "time": "30m" }
```
Time format: `"30m"` / `"1h"` / `"90s"` / ISO 8601 (`"2025-06-01T14:30:00"`)

### WebSocket Endpoints

| Endpoint | Description |
|----------|-------------|
| `WS /ws/status` | Live state broadcast (frontend connects here) |
| `WS /ws/mic` | Stream raw PCM from browser mic |

**WS /ws/status** — messages received by the frontend:
```json
{ "state": "idle" }
{ "state": "listening" }
{ "state": "thinking", "transcript": "..." }
{ "state": "speaking", "response": "..." }
{ "state": "tutor_question", "question": "...", "topic": "...", "index": 4 }
{ "state": "tutor_feedback", "correct": true, "explanation": "..." }
{ "state": "reminder", "message": "..." }
```

**WS /ws/mic** — protocol:
1. Connect to `ws://localhost:8000/ws/mic`
2. Send binary frames of raw PCM (16-bit, 16 kHz, mono) from `getUserMedia`
3. Send text `"END"` to trigger transcription and routing
4. Receive transcription confirmation as text

---

## 🧪 Running Tests

Start the server first, then in a second terminal:

```bash
# Chat tests (no mic needed)
pytest test_chat.py -v

# Tutor session + reminder tests (no mic needed)
pytest test_tutor.py -v

# All tests
pytest test_chat.py test_tutor.py -v
```

---

## 📁 File Structure

```
backend/
  main.py               FastAPI app, all route mounting, lifespan hooks
  voice_pipeline.py     Wake word detection, STT, intent routing
  openclaw_client.py    OpenClaw AI gateway wrapper + conversation.json persistence
  tts_client.py         ElevenLabs streaming TTS + pyttsx3 fallback
  tutor_engine.py       Tutor mode: concept extraction, Q&A loop, scoring
  reminder_engine.py    APScheduler reminders + reminders.json persistence
  ws_manager.py         WebSocket connection manager + broadcast
  chime.wav             Auto-generated wake-word activation chime
  conversation.json     Chat history (auto-created)
  tutor_sessions.json   Completed tutor session summaries
  reminders.json        Upcoming reminders
  .env.example          Env var template — copy to .env
  requirements.txt      Pinned Python dependencies
  test_chat.py          Chat endpoint integration tests
  test_tutor.py         Tutor + reminder integration tests
  README.md             This file
```

---

## 🔌 Frontend Integration (Next.js)

The frontend teammate connects to:
- `http://localhost:8000` — REST API (CORS enabled for `localhost:3000`)
- `ws://localhost:8000/ws/status` — real-time state updates

**Minimal React hook example:**
```js
useEffect(() => {
  const ws = new WebSocket("ws://localhost:8000/ws/status");
  ws.onmessage = (e) => {
    const { state, ...data } = JSON.parse(e.data);
    setViwoBotState(state);  // "idle" | "listening" | "thinking" | "speaking" | "reminder" | etc.
    setPayload(data);
  };
  return () => ws.close();
}, []);
```

---

## ⚠️ Known Limitations (MVP)

- Only one tutor session at a time (stateful singleton)
- Wake word detection requires a working mic and `PORCUPINE_ACCESS_KEY`
- ElevenLabs PCM streaming may need `soundfile` for WAV/MP3 if PCM mode isn't supported on your plan tier
- Whisper offline STT requires extra: `pip install openai-whisper` and the first run downloads the model (~150 MB)
