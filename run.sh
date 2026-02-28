#!/usr/bin/env bash
# run.sh - Starts both the Viwo Bot Backend and Frontend together

# Get the absolute path of the directory containing this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Starting Viwo Bot..."

# Kill any existing stray processes on our ports
echo "🧹 Cleaning up old processes..."
lsof -t -i:8000 -n -P | xargs kill -9 2>/dev/null || true
lsof -t -i:5173 -n -P | xargs kill -9 2>/dev/null || true

# 1. Start the React Frontend in the background
echo "🟢 Starting Frontend (http://localhost:5173)..."
cd "$SCRIPT_DIR/frontend"
npm run dev > /dev/null 2>&1 &
FRONTEND_PID=$!

# 2. Start the FastAPI Backend in the foreground
echo "🟢 Starting Backend..."

# Trap CTRL+C to kill both services cleanly
trap 'echo "🛑 Stopping Viwo Bot..."; kill $FRONTEND_PID; exit 0' SIGINT SIGTERM

# Run uvicorn from the backend folder
cd "$SCRIPT_DIR/backend"
uvicorn main:app --reload --port 8000

