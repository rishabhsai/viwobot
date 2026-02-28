# NovaBot (ViwoBot)

NovaBot is an in-home AI assistant project with:
- A public landing/waitlist site (React + Vite, deployed on Vercel)
- A backend voice assistant API (FastAPI + Python)

Live landing page: https://novabotlanding.vercel.app/landing

## Repo Structure

- `frontend/` React + TypeScript + Vite app
- `backend/` FastAPI backend for voice assistant flows
- `run.sh` helper script for local workflows

## Quick Start

### 1. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` by default.

### 2. Backend

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```

Backend runs on `http://localhost:8000`.

## Deploy

The frontend is deployed to Vercel. Current production domain:
- `https://novabotlanding.vercel.app`

Root (`/`) redirects to `/landing`.

## Notes

- Waitlist collection is currently email-based (no backend form handling).
- For backend configuration and APIs, see `backend/README.md`.
