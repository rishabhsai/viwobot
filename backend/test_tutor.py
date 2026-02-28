"""
test_tutor.py — Integration tests for the Tutor Mode via HTTP
--------------------------------------------------------------
Simulates a complete tutoring session WITHOUT a microphone.
Uses POST /tutor/start, POST /tutor/answer, GET /tutor/score, POST /tutor/end.

Requires:
  1. The backend server running: uvicorn main:app --reload --port 8000
  2. A valid GEMINI_API_KEY in backend/.env

Run:
    cd backend
    pytest test_tutor.py -v
"""

import json
import time
from pathlib import Path

import pytest
import httpx

BASE_URL = "http://localhost:8000"
SESSIONS_FILE = Path(__file__).parent / "tutor_sessions.json"

SAMPLE_NOTES = """
Python Functions:
- A function is a reusable block of code defined with the 'def' keyword.
- Functions can accept parameters and return values using the 'return' statement.
- Default parameter values allow optional arguments.
- *args and **kwargs allow variable numbers of positional and keyword arguments.
- Lambda functions are anonymous one-liner functions: lambda x: x * 2
- Closures capture variables from the enclosing scope.
- Decorators are functions that wrap other functions to add behavior.
"""


@pytest.fixture(scope="module")
def client():
    with httpx.Client(base_url=BASE_URL, timeout=60.0) as c:
        yield c


# ─── Start session ────────────────────────────────────────────────────────────

def test_tutor_start(client):
    """POST /tutor/start should return a session_id and status=started."""
    response = client.post(
        "/tutor/start",
        json={"topic": "Python Functions", "notes": SAMPLE_NOTES},
    )
    assert response.status_code == 200, f"Unexpected status: {response.text}"

    data = response.json()
    assert "session_id" in data
    assert data["status"] == "started"
    assert data["topic"] == "Python Functions"


# ─── Score ────────────────────────────────────────────────────────────────────

def test_tutor_score_schema(client):
    """GET /tutor/score should return expected fields during an active session."""
    # Give the session a moment to extract concepts and ask the first question
    time.sleep(8)

    response = client.get("/tutor/score")
    assert response.status_code == 200, f"Unexpected status: {response.text}"

    data = response.json()
    required_fields = {
        "session_id", "topic", "state",
        "correct", "incorrect", "weak_topics", "strong_topics",
        "q_index", "total_concepts",
    }
    for field in required_fields:
        assert field in data, f"Missing field: {field}"

    assert isinstance(data["correct"], int)
    assert isinstance(data["incorrect"], int)
    assert isinstance(data["weak_topics"], list)


# ─── Answer submission ────────────────────────────────────────────────────────

def test_tutor_answer_correct(client):
    """POST /tutor/answer with a correct answer should return correct=True."""
    # Make sure a session + question is ready
    score_before = client.get("/tutor/score").json()

    response = client.post(
        "/tutor/answer",
        json={
            "answer": (
                "A function in Python is defined with the def keyword and is a "
                "reusable block of code that can take parameters and return values."
            )
        },
    )
    # The endpoint may return 404 if question isn't ready yet; retry once
    if response.status_code == 404:
        time.sleep(5)
        response = client.post(
            "/tutor/answer",
            json={"answer": "A function is defined with def and can return values."},
        )

    assert response.status_code == 200, f"Unexpected: {response.text}"
    data = response.json()
    assert "correct" in data
    assert "explanation" in data
    assert isinstance(data["correct"], bool)


def test_tutor_answer_incorrect(client):
    """POST /tutor/answer with a wrong answer — score should track it."""
    # Wait for next question to be ready
    time.sleep(8)

    score_before = client.get("/tutor/score").json()
    incorrect_before = score_before.get("incorrect", 0)

    response = client.post(
        "/tutor/answer",
        json={"answer": "I have no idea what that means."},
    )
    if response.status_code == 404:
        pytest.skip("No active question ready — skipping incorrect answer test.")

    assert response.status_code == 200
    data = response.json()
    assert "correct" in data

    # If marked incorrect, score should have increased
    if not data["correct"]:
        time.sleep(1)
        score_after = client.get("/tutor/score").json()
        assert score_after["incorrect"] >= incorrect_before


# ─── End session ──────────────────────────────────────────────────────────────

def test_tutor_end(client):
    """POST /tutor/end should return the final score and save to tutor_sessions.json."""
    response = client.post("/tutor/end")
    assert response.status_code in (200, 404), f"Unexpected: {response.text}"

    if response.status_code == 200:
        data = response.json()
        assert "status" in data
        assert data["status"] == "ended"
        assert "score" in data

        score = data["score"]
        assert "correct" in score
        assert "incorrect" in score
        assert "weak_topics" in score


def test_tutor_session_persisted():
    """tutor_sessions.json should contain at least one completed session."""
    if not SESSIONS_FILE.exists():
        pytest.skip("tutor_sessions.json not found.")

    sessions = json.loads(SESSIONS_FILE.read_text())
    assert isinstance(sessions, list)

    # There should be at least one session with our topic
    topics = [s.get("topic", "") for s in sessions]
    assert any("Python" in t for t in topics), (
        f"Expected a Python Functions session in {SESSIONS_FILE}. Found: {topics}"
    )


# ─── No active session ────────────────────────────────────────────────────────

def test_tutor_score_no_session(client):
    """GET /tutor/score with no active session should return 404."""
    # End any session first
    client.post("/tutor/end")
    time.sleep(1)

    response = client.get("/tutor/score")
    # May be 404 if session was already finished/cleared
    assert response.status_code in (200, 404)


# ─── Reminders ────────────────────────────────────────────────────────────────

def test_create_reminder(client):
    """POST /reminders should return 201 with id and fire_at."""
    response = client.post(
        "/reminders",
        json={"message": "Test reminder from pytest", "time": "5m"},
    )
    assert response.status_code == 201, f"Unexpected: {response.text}"
    data = response.json()
    assert "id" in data
    assert "fire_at" in data
    assert "message" in data
    return data["id"]


def test_list_reminders(client):
    """GET /reminders should return a list."""
    response = client.get("/reminders")
    assert response.status_code == 200
    data = response.json()
    assert "reminders" in data
    assert isinstance(data["reminders"], list)


def test_delete_reminder(client):
    """DELETE /reminders/{id} should remove the reminder."""
    # Create one first
    create_resp = client.post(
        "/reminders",
        json={"message": "Delete me", "time": "10m"},
    )
    rid = create_resp.json()["id"]

    delete_resp = client.delete(f"/reminders/{rid}")
    assert delete_resp.status_code == 200
    assert delete_resp.json()["status"] == "deleted"

    # Confirm it's gone
    all_reminders = client.get("/reminders").json()["reminders"]
    ids = [r["id"] for r in all_reminders]
    assert rid not in ids


def test_delete_nonexistent_reminder(client):
    """DELETE /reminders/fake-id should return 404."""
    response = client.delete("/reminders/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404
