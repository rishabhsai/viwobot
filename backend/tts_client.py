"""
tts_client.py — Text-to-Speech Client
---------------------------------------
Primary:  ElevenLabs streaming TTS (eleven_turbo_v2) — low-latency streaming
          audio piped directly to the system speaker via sounddevice.
Fallback: pyttsx3 offline TTS when ELEVENLABS_API_KEY is absent.

Usage:
    from tts_client import speak
    speak("Hello, I am Viwo Bot!")

Environment variables (from .env):
    ELEVENLABS_API_KEY — optional; omit to use pyttsx3 fallback
"""

import io
import logging
import os
import threading

from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# ElevenLabs voice — Rachel (a clear, natural-sounding voice)
# Change ELEVENLABS_VOICE_ID in your .env if you prefer a different voice.
# Browse voices at: https://elevenlabs.io/voice-library
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")  # Rachel
ELEVENLABS_MODEL = "eleven_turbo_v2"

# Max characters sent to ElevenLabs per TTS call — protects your credit quota.
# 250 chars ≈ 2–3 spoken sentences. Raise in .env if you want longer responses.
# Set to 0 to disable the cap (use all credits freely).
TTS_MAX_CHARS = int(os.getenv("TTS_MAX_CHARS", "250"))


def _truncate_for_tts(text: str) -> str:
    """
    Trim text to TTS_MAX_CHARS at a sentence boundary to avoid cutting mid-word.
    Falls back to hard truncation if no sentence boundary is found.
    """
    if TTS_MAX_CHARS <= 0 or len(text) <= TTS_MAX_CHARS:
        return text
    # Find last sentence boundary within the limit
    truncated = text[:TTS_MAX_CHARS]
    for sep in (". ", "! ", "? ", "\n"):
        last = truncated.rfind(sep)
        if last > TTS_MAX_CHARS // 2:  # Don't cut too early
            return truncated[:last + 1].strip()
    return truncated.strip() + "…"

# Lock ensures only one TTS operation runs at a time (prevents audio overlap)
_tts_lock = threading.Lock()


# ─── ElevenLabs streaming TTS ─────────────────────────────────────────────────

def _speak_elevenlabs(text: str):
    """
    Stream audio from ElevenLabs and play it chunk-by-chunk via sounddevice.
    This starts playback before the full audio is generated (low latency).
    """
    try:
        from elevenlabs import ElevenLabs, VoiceSettings
        import sounddevice as sd
        import numpy as np

        api_key = os.getenv("ELEVENLABS_API_KEY")
        client = ElevenLabs(api_key=api_key)

        # Request streaming audio (mp3 format)
        audio_stream = client.text_to_speech.convert(
            voice_id=ELEVENLABS_VOICE_ID,
            model_id=ELEVENLABS_MODEL,
            text=text,
            voice_settings=VoiceSettings(
                stability=0.5,
                similarity_boost=0.75,
                style=0.0,
                use_speaker_boost=True,
            ),
            output_format="pcm_22050",  # Raw PCM — easiest to pipe to sounddevice
        )

        # Collect PCM chunks and play as they arrive
        sample_rate = 22050
        channels = 1
        dtype = "int16"

        # sounddevice OutputStream for real-time playback
        with sd.OutputStream(
            samplerate=sample_rate,
            channels=channels,
            dtype=dtype,
        ) as stream:
            for chunk in audio_stream:
                if chunk:
                    audio_array = np.frombuffer(chunk, dtype=dtype)
                    stream.write(audio_array)

        logger.debug("ElevenLabs TTS playback complete.")

    except Exception as exc:
        logger.error("ElevenLabs TTS failed: %s — falling back to pyttsx3.", exc)
        _speak_pyttsx3(text)


# ─── pyttsx3 offline fallback ─────────────────────────────────────────────────

def _speak_pyttsx3(text: str):
    """
    Offline TTS via pyttsx3. Works without any API key.
    Voice quality is lower but fully functional.
    """
    try:
        import pyttsx3

        engine = pyttsx3.init()
        engine.setProperty("rate", 165)   # Speaking rate (words per minute)
        engine.setProperty("volume", 0.9)

        # Try to select a natural-sounding voice (index 1 is often female on macOS)
        voices = engine.getProperty("voices")
        if voices and len(voices) > 1:
            engine.setProperty("voice", voices[1].id)

        engine.say(text)
        engine.runAndWait()
        engine.stop()
        logger.debug("pyttsx3 TTS playback complete.")

    except Exception as exc:
        logger.error("pyttsx3 TTS also failed: %s", exc)


# ─── Public API ───────────────────────────────────────────────────────────────

def speak(text: str, blocking: bool = True):
    """
    Speak the given text aloud.

    Args:
        text:     The text to speak.
        blocking: If True (default), block until audio finishes.
                  If False, run in a daemon thread (fire-and-forget).
    """
    if not text or not text.strip():
        return

    # Cap characters to protect ElevenLabs credits (configurable via TTS_MAX_CHARS in .env)
    text = _truncate_for_tts(text)

    has_elevenlabs = bool(os.getenv("ELEVENLABS_API_KEY"))
    _fn = _speak_elevenlabs if has_elevenlabs else _speak_pyttsx3

    def _run():
        with _tts_lock:
            _fn(text)

    if blocking:
        _run()
    else:
        t = threading.Thread(target=_run, daemon=True)
        t.start()
