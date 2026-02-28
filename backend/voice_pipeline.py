"""
voice_pipeline.py — Wake Word Detection, STT & Intent Routing
--------------------------------------------------------------
Runs a background thread that:
  1. Listens for the wake word via Porcupine ("hey google" placeholder)
  2. Plays a chime WAV, then records the user's speech
  3. Transcribes via Google STT (falls back to local Whisper)
  4. Detects intent: chat / study / reminder
  5. Routes to the right engine (gemini, tutor, reminder)
  6. Broadcasts WS state throughout

Also handles:
  - POST /ws/mic WebSocket — accepts raw PCM from browser/phone mic
    and runs the same STT → intent → TTS pipeline.

IMPORTANT — Porcupine wake word:
  This implementation uses the built-in "hey google" keyword as a placeholder
  for "Hey Viwo". To train a custom "Hey Viwo" wake word (free!):
  1. Go to https://console.picovoice.ai/
  2. Sign in and navigate to "Custom Wake Word"
  3. Type "Hey Viwo" and click Train
  4. Download the .ppn file
  5. Set PORCUPINE_KEYWORD_PATH=/path/to/hey-viwo.ppn in your .env
  Without a custom .ppn, the pipeline uses the built-in "hey google" keyword.

Environment variables:
    PORCUPINE_ACCESS_KEY  — required for wake word detection
    PORCUPINE_KEYWORD_PATH — optional path to custom .ppn model
    STT_ENGINE            — "google" (default) or "whisper"
"""

import io
import logging
import os
import struct
import threading
import time
import wave
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# Path to chime WAV played on wake
CHIME_PATH = Path(__file__).parent / "chime.wav"

# Maximum seconds to record if the user never stops talking
RECORD_MAX_SECONDS = 15
# Seconds of silence required to consider the user "done speaking"
SILENCE_THRESHOLD_SECONDS = 1.0
# RMS volume threshold to classify audio as "silence" (tune if needed)
SILENCE_RMS_THRESHOLD = 500

# Conversational follow-up mode — after Nova speaks, stay listening this long
FOLLOW_UP_SECONDS = 5
# Max follow-up rounds before returning to wake word (prevents infinite loops)
FOLLOW_UP_MAX_ROUNDS = 5

# Whether the voice pipeline loop should run
_running = False
_pipeline_thread: Optional[threading.Thread] = None


# ─── STT helpers ─────────────────────────────────────────────────────────────

def _transcribe_google(audio_data: bytes, sample_rate: int = 16000) -> str:
    """Transcribe raw PCM bytes using Google Speech Recognition (online)."""
    import speech_recognition as sr

    recognizer = sr.Recognizer()
    # Convert raw PCM bytes to AudioData object
    audio = sr.AudioData(audio_data, sample_rate, 2)  # 2 bytes per sample (int16)
    try:
        text = recognizer.recognize_google(audio)
        logger.info("Google STT: %s", text)
        return text
    except sr.UnknownValueError:
        logger.warning("Google STT: could not understand audio.")
        return ""
    except sr.RequestError as exc:
        logger.error("Google STT request failed: %s", exc)
        return ""


def _transcribe_whisper(audio_data: bytes, sample_rate: int = 16000) -> str:
    """Transcribe raw PCM bytes using local OpenAI Whisper (offline)."""
    try:
        import whisper
        import numpy as np
        import tempfile

        model = whisper.load_model("base")  # Loads once — subsequent calls reuse cache
        # Write to temp WAV so Whisper can read it
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            tmp_path = f.name
            with wave.open(f, "wb") as wf:
                wf.setnchannels(1)
                wf.setsampwidth(2)
                wf.setframerate(sample_rate)
                wf.writeframes(audio_data)
        result = model.transcribe(tmp_path)
        text = result.get("text", "").strip()
        logger.info("Whisper STT: %s", text)
        Path(tmp_path).unlink(missing_ok=True)
        return text
    except Exception as exc:
        logger.error("Whisper transcription failed: %s", exc)
        return ""


def transcribe(audio_data: bytes, sample_rate: int = 16000) -> str:
    """
    Transcribe audio using the configured STT engine.
    Defaults to Google STT; set STT_ENGINE=whisper in .env for offline mode.
    """
    engine = os.getenv("STT_ENGINE", "google").lower()
    if engine == "whisper":
        return _transcribe_whisper(audio_data, sample_rate)
    result = _transcribe_google(audio_data, sample_rate)
    if not result:
        # Auto-fallback to Whisper if Google fails
        logger.info("Falling back to Whisper STT.")
        return _transcribe_whisper(audio_data, sample_rate)
    return result


# ─── Smart dispatcher (OpenClaw-powered) ────────────────────────────────────

_DISPATCH_PROMPT = """\
You are Nova, an exceptionally conversational, friendly, and proactive personal AI assistant. 
You are listening to the user's voice command.

USER'S CURRENT MEMORY/CONTEXT: 
{memory_context}

THE USER JUST SAID: "{transcript}"

Analyze their request and respond in EXACTLY this structured format (no extra markdown):

If setting a reminder:
ACTION:remind
MESSAGE:<the core reminder concept, e.g. "eat something and take a break">
TIME:<time spec like 1m, 30m, 1h>
SAY:<what you say back to the user to confirm the reminder AND answer any questions they asked, warm and natural. End with a proactive question offering further help if appropriate.>

If starting a study/tutor session:
ACTION:study
TOPIC:<topic to study>
SAY:<what you say to the user, 1 warm sentence>

If general chat, answering a question, or checking memory:
ACTION:chat
SAY:<your smart, contextual response. If checking memory, state the answer conversationally. Always end by proactively offering follow up, e.g., "Do you need me to suggest anything else?" or "Can I help with your hackathon?">

IMPORTANT RULES: 
1. Respond ONLY with the structured format above, no markdown.
2. Be extremely smart and conversational. Do not sound like a robot taking exact phrases. If they ask "do I have assignments and also remind me to eat in 15m", use ACTION:remind, but the SAY block should fluidly handle BOTH intents.
3. 🚨 CRITICAL MEMORY CHECK 🚨: Before responding, you MUST evaluate the user's request against every single memory listed above. If the user suggests an action that violates a memory (for example, suggesting to cook fish or seafood when Vishwa is coming over), you MUST immediately reject the idea based on the memory ("Oh wait, Vishwa doesn't like fish!") and proactively suggest a specific alternative ("Why don't I order you some chicken instead?").
"""


def _parse_dispatch_response(response: str) -> dict:
    """
    Parse the structured response from OpenClaw's smart dispatcher.
    Returns a dict with 'action', 'say', and optional 'message'/'time'/'topic'.
    Falls back to action='chat' if parsing fails.
    """
    result = {"action": "chat", "say": response, "message": "", "time": "5m", "topic": ""}
    lines = [line.strip() for line in response.strip().splitlines() if line.strip()]
    for line in lines:
        if line.startswith("ACTION:"):
            result["action"] = line[len("ACTION:"):].strip().lower()
        elif line.startswith("MESSAGE:"):
            result["message"] = line[len("MESSAGE:"):].strip()
        elif line.startswith("TIME:"):
            result["time"] = line[len("TIME:"):].strip()
        elif line.startswith("TOPIC:"):
            result["topic"] = line[len("TOPIC:"):].strip()
        elif line.startswith("SAY:"):
            result["say"] = line[len("SAY:"):].strip()
    return result


def _smart_dispatch(
    transcript: str,
    ws_manager,
    gemini_client,
    tts_speak_fn,
    reminder_engine,
    tutor_engine,
):
    """
    Route every transcript through OpenClaw for full AI-powered intent detection,
    reminder reformulation, and response generation.

    OpenClaw decides:
    - What action to take (chat / remind / study)
    - How to rephrase reminder messages naturally
    - How to answer composite questions using the injected user memory
    - What to say back to the user
    """
    # Load dynamic memories from memories.json
    memory_context = ""
    try:
        import json
        memories_path = Path(__file__).parent / "memories.json"
        if memories_path.exists():
            with open(memories_path, "r", encoding="utf-8") as f:
                memories_data = json.load(f)
                memory_lines = [f"- {m.get('text', '')}" for m in memories_data if m.get("text")]
                memory_context = "\n".join(memory_lines)
    except Exception as exc:
        logger.error("Failed to load memories: %s", exc)

    prompt = _DISPATCH_PROMPT.format(transcript=transcript, memory_context=memory_context)

    try:
        raw_response = gemini_client.chat_raw(prompt)
    except Exception as exc:
        logger.error("Smart dispatch OpenClaw call failed: %s", exc)
        tts_speak_fn("Sorry, I had a hiccup. Can you say that again?", blocking=True)
        return

    parsed = _parse_dispatch_response(raw_response)
    action = parsed["action"]
    say = parsed["say"]

    logger.info("Smart dispatch → action=%s | say=%s", action, say[:60])

    if action == "remind":
        message = parsed["message"] or transcript
        time_str = parsed["time"] or "5m"
        try:
            reminder_engine.add(message=message, time_str=time_str)
            ws_manager.broadcast_sync({"state": "speaking", "response": say})
            tts_speak_fn(say, blocking=True)
        except Exception as exc:
            logger.error("Smart dispatch reminder failed: %s", exc)
            tts_speak_fn("Sorry, I couldn't set that reminder.", blocking=False)

    elif action == "study":
        topic = parsed["topic"] or "general"
        ws_manager.broadcast_sync({"state": "speaking", "response": say})
        tts_speak_fn(say, blocking=True)
        tutor_engine.start(topic=topic, notes="")

    else:
        # General chat — use main session for conversation history
        response = gemini_client.chat(transcript)
        ws_manager.broadcast_sync({"state": "speaking", "response": response})
        tts_speak_fn(response, blocking=True)



# ─── Chime ────────────────────────────────────────────────────────────────────

def _play_chime():
    """Play the wake-word activate chime WAV file."""
    if not CHIME_PATH.exists():
        # Generate a simple beep as fallback if chime.wav is missing
        _play_beep()
        return
    try:
        import sounddevice as sd
        import soundfile as sf

        data, sr = sf.read(str(CHIME_PATH))
        sd.play(data, sr, blocking=True)
    except Exception as exc:
        logger.warning("Chime playback failed: %s", exc)
        _play_beep()


def _play_beep():
    """Generate and play a short 880 Hz beep as a chime fallback."""
    try:
        import sounddevice as sd
        import numpy as np

        sr = 22050
        t = numpy.linspace(0, 0.25, int(sr * 0.25), endpoint=False)
        beep = (np.sin(2 * np.pi * 880 * t) * 0.5).astype(np.float32)
        sd.play(beep, sr, blocking=True)
    except Exception as exc:
        logger.debug("Beep also failed: %s", exc)


def _generate_chime_wav():
    """
    Generate a simple chime.wav file if it doesn't exist.
    Creates a 440 Hz A-note tone (0.3 s) with fade-out.
    """
    try:
        import numpy as np

        sr = 22050
        duration = 0.3
        t = np.linspace(0, duration, int(sr * duration), endpoint=False)
        tone = np.sin(2 * np.pi * 880 * t)
        # Apply fade-out envelope
        fade = np.linspace(1.0, 0.0, len(tone))
        tone = (tone * fade * 32767).astype(np.int16)

        with wave.open(str(CHIME_PATH), "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(sr)
            wf.writeframes(tone.tobytes())
        logger.info("Generated chime.wav at %s", CHIME_PATH)
    except Exception as exc:
        logger.warning("Could not generate chime.wav: %s", exc)


# ─── Recording ────────────────────────────────────────────────────────────────

def _record_audio(audio_stream, chunk_size: int, max_duration: float = 15.0, silence_timeout: float = 4.0, sample_rate: int = 16000) -> bytes:
    """
    Record audio from the system mic using the provided audio stream.
    Waits for the user to start speaking, then stops after trailing silence.
    """
    import numpy as np
    import math

    logger.debug("Recording started (dynamic silence detection)...")
    
    frames = []
    
    # Configuration for Voice Activity Detection
    rms_threshold = 400  # Tuned to prevent background noise from triggering it
    chunks_per_second = sample_rate / chunk_size
    
    # Max chunks of silence BEFORE they start speaking
    max_silent_chunks_before = int(chunks_per_second * silence_timeout)
    # Max chunks of silence AFTER they finish speaking (cut off after 1.5 seconds)
    max_silent_chunks_after = int(chunks_per_second * 1.5)

    
    max_total_chunks = int(chunks_per_second * max_duration)

    has_spoken = False
    silent_chunks = 0

    # Clear stale frames from buffer to prevent recording old audio
    try:
        available = audio_stream.get_read_available()
        if available > 0:
            audio_stream.read(available, exception_on_overflow=False)
    except Exception:
        pass

    for i in range(max_total_chunks):
        if not _running:
            break
            
        data = audio_stream.read(chunk_size, exception_on_overflow=False)
        frames.append(data)
        
        # Calculate RMS (volume) of the current chunk
        audio_data = np.frombuffer(data, dtype=np.int16)
        rms = math.sqrt(np.mean(np.square(audio_data, dtype=np.float64)))
        
        if rms > rms_threshold:
            has_spoken = True
            silent_chunks = 0
        else:
            silent_chunks += 1
            
        # Stopping conditions
        if not has_spoken and silent_chunks > max_silent_chunks_before:
            logger.debug("No speech detected, stopping recording early.")
            break
        elif has_spoken and silent_chunks > max_silent_chunks_after:
            logger.debug("Trailing silence detected, ending recording.")
            break
            
    return b''.join(frames)


# ─── Wake word loop ───────────────────────────────────────────────────────────

def _wake_word_loop(ws_manager, gemini_client, tts_speak_fn, reminder_engine, tutor_engine):
    """
    Continuous background loop using Porcupine to listen for the wake word.
    On detection: play chime → record → STT → intent → route → TTS.
    """
    import pvporcupine
    import pyaudio

    access_key = os.getenv("PORCUPINE_ACCESS_KEY", "")
    keyword_path = os.getenv("PORCUPINE_KEYWORD_PATH", "")

    if not access_key:
        logger.warning(
            "PORCUPINE_ACCESS_KEY not set. Wake word detection disabled.\n"
            "Set it in .env to enable always-on listening."
        )
        return

    try:
        # Use custom .ppn file if provided (trained "Hey Viwo" from console.picovoice.ai)
        # Otherwise fall back to built-in "hey google" keyword as placeholder
        if keyword_path and Path(keyword_path).exists():
            porcupine = pvporcupine.create(
                access_key=access_key,
                keyword_paths=[keyword_path],
            )
            logger.info("Porcupine: using custom keyword at %s", keyword_path)
        else:
            # Built-in keyword closest to "Hey Viwo".
            # Options: "hey google", "computer", "jarvis", "alexa", "hey siri"
            # Train your own at console.picovoice.ai → Custom Wake Word → type "Hey Viwo"
            porcupine = pvporcupine.create(
                access_key=access_key,
                keywords=["hey google"],
            )
            logger.info("Porcupine: using built-in 'hey google' keyword (placeholder).")
    except Exception as exc:
        logger.error("Failed to initialise Porcupine: %s", exc)
        return

    pa = pyaudio.PyAudio()
    audio_stream = pa.open(
        rate=porcupine.sample_rate,
        channels=1,
        format=pyaudio.paInt16,
        input=True,
        frames_per_buffer=porcupine.frame_length,
    )

    logger.info("Wake word detection active. Say 'Hey Nova'! 🎙️")
    ws_manager.broadcast_sync({"state": "idle"})

    try:
        trigger_recording = False
        while _running:
            try:
                if not trigger_recording:
                    pcm_bytes = audio_stream.read(porcupine.frame_length, exception_on_overflow=False)
                    pcm_frame = struct.unpack_from(f"{porcupine.frame_length}h", pcm_bytes)
                    keyword_index = porcupine.process(pcm_frame)
                else:
                    keyword_index = 1  # Force trigger
                    trigger_recording = False

                if keyword_index >= 0:
                    logger.info("Wake word detected!")
                    ws_manager.broadcast_sync({"state": "listening"})
                    _play_chime()
                    
                    # ─── Custom TTS that supports Wake Word Interruption ───
                    def custom_tts_speak(text, blocking=True):
                        if not blocking:
                            return tts_speak_fn(text, blocking=False)
                            
                        # Start background TTS
                        tts_thread = tts_speak_fn(text, blocking=False)
                        if not tts_thread:
                            return
                            
                        import tts_client
                        interrupted = False
                        
                        # Listen for the wake word again while TTS is playing
                        while tts_thread.is_alive() and _running:
                            try:
                                # Non-blocking read to prevent PyAudio from hanging on macOS
                                # when sounddevice is simultaneously playing output.
                                if audio_stream.get_read_available() >= porcupine.frame_length:
                                    p_bytes = audio_stream.read(porcupine.frame_length, exception_on_overflow=False)
                                    p_frame = struct.unpack_from(f"{porcupine.frame_length}h", p_bytes)
                                    if porcupine.process(p_frame) >= 0:
                                        logger.info("Wake word detected during TTS playback! Interrupting...")
                                        tts_client.interrupt()
                                        interrupted = True
                                        break
                                else:
                                    import time
                                    time.sleep(0.05)  # Wait briefly for more audio frames
                            except Exception as exc:
                                logger.warning("Audio read error during TTS: %s", exc)
                                import time
                                time.sleep(0.1)
                                
                        tts_thread.join()
                        if interrupted:
                            raise InterruptedError("TTS Interrupted")

                    # Record user's utterance
                    audio_data = _record_audio(audio_stream, porcupine.frame_length, max_duration=15.0, silence_timeout=4.0)

                    # Transcribe
                    ws_manager.broadcast_sync({"state": "thinking", "transcript": "..."})
                    transcript = transcribe(audio_data)

                    # If silence or empty transcript, just drop to idle (no error message)
                    if not transcript:
                        logger.info("No speech detected after wake word. Dropping to idle.")
                        ws_manager.broadcast_sync({"state": "idle"})
                        continue

                    ws_manager.broadcast_sync({"state": "thinking", "transcript": transcript})
                    logger.info("Transcript: %s", transcript)

                    # Detect intent and route
                    _route(
                        transcript,
                        ws_manager,
                        gemini_client,
                        custom_tts_speak,
                        reminder_engine,
                        tutor_engine,
                    )

                    # ── Conversational follow-up mode ──────────────────────────────
                    # After Nova responds, stay listening for FOLLOW_UP_SECONDS
                    # so the user can keep talking without saying "Hey Nova" again.
                    _conversational_follow_up(
                        ws_manager, gemini_client, custom_tts_speak, reminder_engine, tutor_engine, audio_stream, porcupine.frame_length
                    )
                    
                    ws_manager.broadcast_sync({"state": "idle"})
                    
                    # ── Flush Audio Buffer ─────────────────────────────────────────
                    # Prevent the wake word engine from processing old/stale audio
                    # that buffered while TTS was playing or during processing.
                    try:
                        available = audio_stream.get_read_available()
                        if available > 0:
                            audio_stream.read(available, exception_on_overflow=False)
                    except Exception:
                        pass
                    
            except InterruptedError:
                logger.info("TTS was interrupted. Looping back to record immediately.")
                # We already heard the wake word to trigger the interrupt
                # So we jump straight back into the recording sequence
                trigger_recording = True
                
            except Exception as exc:
                logger.error("Error in wake word loop: %s", exc)
                import time
                time.sleep(0.5)
                ws_manager.broadcast_sync({"state": "idle"})
                
    finally:
        audio_stream.stop_stream()
        audio_stream.close()
        pa.terminate()
        porcupine.delete()
        logger.info("Wake word loop stopped.")


def _conversational_follow_up(
    ws_manager, gemini_client, tts_speak_fn, reminder_engine, tutor_engine, audio_stream, chunk_size
):
    """
    After Nova finishes speaking, stay in active listening mode for FOLLOW_UP_SECONDS.
    If the user speaks within that window → process the reply and loop again.
    If silence → return to wake word idle.
    Limits to FOLLOW_UP_MAX_ROUNDS back-and-forth exchanges per activation.
    """
    for round_num in range(FOLLOW_UP_MAX_ROUNDS):
        if not _running:
            break

        logger.info(
            "Conversational mode: listening for %ds (round %d/%d)...",
            FOLLOW_UP_SECONDS, round_num + 1, FOLLOW_UP_MAX_ROUNDS,
        )
        ws_manager.broadcast_sync({"state": "listening"})

        # Record follow-up audio without needing wake word
        # Give them up to 5s to start speaking, but let them speak up to 15s total
        audio_data = _record_audio(audio_stream, chunk_size, max_duration=15.0, silence_timeout=FOLLOW_UP_SECONDS)
        ws_manager.broadcast_sync({"state": "thinking", "transcript": "..."})
        transcript = transcribe(audio_data)

        if not transcript.strip():
            # Silence — user is done talking for now
            logger.info("No follow-up speech. Returning to idle.")
            ws_manager.broadcast_sync({"state": "idle"})
            break

        logger.info("Follow-up transcript: %s", transcript)
        ws_manager.broadcast_sync({"state": "thinking", "transcript": transcript})
        _route(transcript, ws_manager, gemini_client, tts_speak_fn, reminder_engine, tutor_engine)

    else:
        # Hit max rounds — politely let the user know
        tts_speak_fn("I'll let you get on with it. Just say Hey Nova when you need me!", blocking=False)
        ws_manager.broadcast_sync({"state": "idle"})


def _route(transcript, ws_manager, gemini_client, tts_speak_fn, reminder_engine, tutor_engine):
    """Thin wrapper — all routing now goes through OpenClaw smart dispatch."""
    _smart_dispatch(
        transcript, ws_manager, gemini_client, tts_speak_fn, reminder_engine, tutor_engine
    )


# ─── Public controls ──────────────────────────────────────────────────────────

def start_pipeline(ws_manager, gemini_client, tts_speak_fn, reminder_engine, tutor_engine):
    """
    Start the background wake-word loop thread.
    Also generates chime.wav if it doesn't exist.
    """
    global _running, _pipeline_thread

    if not CHIME_PATH.exists():
        _generate_chime_wav()

    _running = True
    _pipeline_thread = threading.Thread(
        target=_wake_word_loop,
        args=(ws_manager, gemini_client, tts_speak_fn, reminder_engine, tutor_engine),
        daemon=True,
        name="VoicePipeline",
    )
    _pipeline_thread.start()
    logger.info("Voice pipeline thread started.")


def stop_pipeline():
    """Signal the wake-word loop to stop."""
    global _running
    _running = False
    logger.info("Voice pipeline stopping...")


# ─── WebSocket mic handler ────────────────────────────────────────────────────

async def handle_mic_websocket(
    websocket,
    ws_manager,
    gemini_client,
    tts_speak_fn,
    reminder_engine,
    tutor_engine,
):
    """
    Handle /ws/mic — accepts raw PCM (16-bit, 16 kHz, mono) from a browser or
    phone microphone, transcribes it, and routes to the correct engine.

    The frontend should:
      1. Connect to ws://localhost:8000/ws/mic
      2. Send binary PCM frames (e.g. from getUserMedia)
      3. Send the text message "END" to trigger transcription
    """
    await websocket.accept()
    logger.info("/ws/mic client connected.")
    ws_manager.broadcast_sync({"state": "listening"})

    audio_chunks: list[bytes] = []
    try:
        while True:
            data = await websocket.receive()
            if data.get("text") == "END":
                break
            if data.get("bytes"):
                audio_chunks.append(data["bytes"])

        if not audio_chunks:
            await websocket.close()
            return

        raw_pcm = b"".join(audio_chunks)
        ws_manager.broadcast_sync({"state": "thinking", "transcript": "..."})
        transcript = transcribe(raw_pcm, sample_rate=16000)

        if not transcript:
            await websocket.send_text("Sorry, I didn't catch that.")
            ws_manager.broadcast_sync({"state": "idle"})
            return

        ws_manager.broadcast_sync({"state": "thinking", "transcript": transcript})

        # Route in a background thread to not block the WS coroutine
        def _route_bg():
            _route(transcript, ws_manager, gemini_client, tts_speak_fn, reminder_engine, tutor_engine)
            ws_manager.broadcast_sync({"state": "idle"})

        threading.Thread(target=_route_bg, daemon=True).start()
        await websocket.send_text(f"Transcribed: {transcript}")

    except Exception as exc:
        logger.error("/ws/mic error: %s", exc)
    finally:
        logger.info("/ws/mic client disconnected.")
