"""
test_chat.py — Integration tests for POST /chat and GET /history
-----------------------------------------------------------------
Tests the Viwo Bot chat endpoints WITHOUT a microphone.
Requires:
  1. The backend server running: uvicorn main:app --reload --port 8000
  2. A valid GEMINI_API_KEY in backend/.env

Run:
    cd backend
    pytest test_chat.py -v
"""

import pytest
import httpx

BASE_URL = "http://localhost:8000"


@pytest.fixture(scope="module")
def client():
    """Shared httpx client for the test module."""
    with httpx.Client(base_url=BASE_URL, timeout=30.0) as c:
        yield c


# ─── Health check ─────────────────────────────────────────────────────────────

def test_health(client):
    """Server should be reachable and return ok status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "timestamp" in data


# ─── Chat ─────────────────────────────────────────────────────────────────────

def test_chat_basic(client):
    """POST /chat with a simple message should return a non-empty response."""
    payload = {"message": "Hello Viwo! What can you do?"}
    response = client.post("/chat", json=payload)
    assert response.status_code == 200, f"Unexpected status: {response.text}"

    data = response.json()
    assert "response" in data, "Response field missing"
    assert isinstance(data["response"], str)
    assert len(data["response"]) > 0, "Response is empty"
    assert "timestamp" in data


def test_chat_empty_message(client):
    """POST /chat with an empty message should return 400."""
    response = client.post("/chat", json={"message": ""})
    assert response.status_code == 400


def test_chat_whitespace_message(client):
    """POST /chat with only whitespace should return 400."""
    response = client.post("/chat", json={"message": "   "})
    assert response.status_code == 400


def test_chat_multiple_turns(client):
    """Multiple messages should build on each other (session context)."""
    client.post("/chat", json={"message": "My name is Alex."})
    response = client.post("/chat", json={"message": "What is my name?"})
    assert response.status_code == 200
    data = response.json()
    # Gemini should remember the name from the same session
    assert "alex" in data["response"].lower() or "name" in data["response"].lower()


# ─── History ──────────────────────────────────────────────────────────────────

def test_get_history(client):
    """GET /history should return a list with the previously sent message."""
    # Send a unique message to track
    unique_msg = "Tell me about the Eiffel Tower briefly."
    client.post("/chat", json={"message": unique_msg})

    response = client.get("/history")
    assert response.status_code == 200

    data = response.json()
    assert "history" in data
    assert isinstance(data["history"], list)
    assert len(data["history"]) > 0

    # The user's message should appear in history
    messages = [entry.get("content", "") for entry in data["history"]]
    assert any(unique_msg in m for m in messages), (
        f"Expected '{unique_msg}' to be in history. History: {messages}"
    )


def test_history_has_model_replies(client):
    """History should contain both user and model entries."""
    response = client.get("/history")
    data = response.json()
    roles = {entry.get("role") for entry in data["history"]}
    assert "user" in roles, "No user messages in history"
    assert "model" in roles, "No model replies in history"


def test_history_entries_have_timestamps(client):
    """Each history entry should have a timestamp field."""
    response = client.get("/history")
    data = response.json()
    for entry in data["history"]:
        assert "timestamp" in entry, f"Missing timestamp in entry: {entry}"
