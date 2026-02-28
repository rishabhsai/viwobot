"""
ws_manager.py — WebSocket Broadcast Manager
--------------------------------------------
Maintains a set of active WebSocket connections and allows any backend
module to broadcast state-change payloads to the frontend dashboard.

Usage:
    from ws_manager import manager
    await manager.broadcast({"state": "thinking", "transcript": "..."})
"""

import json
import asyncio
import logging
from typing import Set
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Manages all active /ws/status WebSocket connections.
    Thread-safe broadcast via asyncio event loop.
    """

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        # We keep a reference to the main event loop so background
        # threads (wake-word, scheduler) can schedule coroutines.
        self._loop: asyncio.AbstractEventLoop | None = None

    def set_loop(self, loop: asyncio.AbstractEventLoop):
        """Call once at startup. Stores the running asyncio event loop."""
        self._loop = loop

    async def connect(self, websocket: WebSocket):
        """Accept a new WebSocket connection and register it."""
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info("WS client connected. Total: %d", len(self.active_connections))

    def disconnect(self, websocket: WebSocket):
        """Remove a disconnected WebSocket."""
        self.active_connections.discard(websocket)
        logger.info("WS client disconnected. Total: %d", len(self.active_connections))

    async def broadcast(self, payload: dict):
        """
        Send a JSON payload to all connected clients.
        Dead connections are automatically removed.
        """
        message = json.dumps(payload)
        disconnected: Set[WebSocket] = set()

        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as exc:
                logger.warning("Failed to send to WS client: %s", exc)
                disconnected.add(connection)

        # Prune dead connections
        for connection in disconnected:
            self.active_connections.discard(connection)

    def broadcast_sync(self, payload: dict):
        """
        Thread-safe broadcast callable from synchronous background threads
        (e.g., wake-word loop, APScheduler callbacks).
        Uses the stored event loop to schedule the coroutine.
        """
        if self._loop is None:
            logger.warning("broadcast_sync called before event loop was set.")
            return
        asyncio.run_coroutine_threadsafe(self.broadcast(payload), self._loop)


# Singleton instance used across all modules
manager = ConnectionManager()
