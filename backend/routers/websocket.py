"""
WebSocket Router - Project Aura Real-Time System
=================================================
Channels:
  /ws/{user_id}                - per-user authenticated connection
  /ws/broadcast/{room}         - room-based (patient-{id}, clinicians, all)

Events pushed server→client:
  new_alert       { alert }
  alert_update    { alert_id, status }
  new_message     { message, conversation_id }
  new_notification{ notification }
  vital_update    { patient_id, vitals }
  patient_status  { patient_id, status, risk_level }
  ping            {}

Client→server:
  subscribe       { rooms: ["patient-1", "clinicians"] }
  unsubscribe     { rooms: [...] }
  pong            {}
"""

import json
import logging
import asyncio
from typing import Dict, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from fastapi.websockets import WebSocketState

router = APIRouter()
logger = logging.getLogger(__name__)

# ── Connection Manager ─────────────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        # user_id → set of WebSocket connections (multi-tab support)
        self.connections: Dict[int, Set[WebSocket]] = {}
        # room_name → set of user_ids
        self.rooms: Dict[str, Set[int]] = {}

    async def connect(self, ws: WebSocket, user_id: int):
        await ws.accept()
        if user_id not in self.connections:
            self.connections[user_id] = set()
        self.connections[user_id].add(ws)
        logger.info(f"WS connected: user {user_id} ({len(self.connections)} users online)")

    def disconnect(self, ws: WebSocket, user_id: int):
        if user_id in self.connections:
            self.connections[user_id].discard(ws)
            if not self.connections[user_id]:
                del self.connections[user_id]
        # Remove from all rooms
        for room_users in self.rooms.values():
            room_users.discard(user_id)
        logger.info(f"WS disconnected: user {user_id}")

    def subscribe(self, user_id: int, rooms: list):
        for room in rooms:
            if room not in self.rooms:
                self.rooms[room] = set()
            self.rooms[room].add(user_id)

    def unsubscribe(self, user_id: int, rooms: list):
        for room in rooms:
            if room in self.rooms:
                self.rooms[room].discard(user_id)

    async def send_to_user(self, user_id: int, event: str, data: dict):
        """Send event to all connections of a specific user."""
        if user_id not in self.connections:
            return
        message = json.dumps({"event": event, "data": data})
        dead = set()
        for ws in list(self.connections[user_id]):
            try:
                if ws.client_state == WebSocketState.CONNECTED:
                    await ws.send_text(message)
            except Exception:
                dead.add(ws)
        # Clean up dead connections
        for ws in dead:
            self.connections[user_id].discard(ws)

    async def broadcast_to_room(self, room: str, event: str, data: dict, exclude_user: int = None):
        """Broadcast event to all users in a room."""
        if room not in self.rooms:
            return
        for uid in list(self.rooms[room]):
            if uid != exclude_user:
                await self.send_to_user(uid, event, data)

    async def broadcast_to_all(self, event: str, data: dict, exclude_user: int = None):
        """Broadcast to every connected user."""
        for uid in list(self.connections.keys()):
            if uid != exclude_user:
                await self.send_to_user(uid, event, data)

    async def send_ping(self):
        """Send keepalive ping to all connections."""
        await self.broadcast_to_all("ping", {})

    @property
    def online_count(self) -> int:
        return len(self.connections)

    @property
    def online_user_ids(self) -> list:
        return list(self.connections.keys())


# Singleton instance - import this from other modules to push events
manager = ConnectionManager()


# ── WebSocket endpoint ────────────────────────────────────────────────────
@router.websocket("/ws/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: int,
    token: str = Query(None),
):
    """
    Authenticated WebSocket connection.
    Connect: ws://localhost:8000/ws/{user_id}?token=<jwt>
    """
    # Validate token
    if not token:
        await websocket.close(code=4001, reason="No token provided")
        return

    from src.db import get_db
    db = next(get_db())
    try:
        user = verify_token(token, db)
        if not user or user.id != user_id:
            await websocket.close(code=4003, reason="Unauthorized")
            return
    except Exception:
        await websocket.close(code=4003, reason="Invalid token")
        return
    finally:
        db.close()

    # Auto-subscribe to role-based rooms
    default_rooms = ["all"]
    if user.role in ("clinician", "admin"):
        default_rooms.append("clinicians")
    if user.role == "caregiver":
        default_rooms.append("caregivers")
    if user.role in ("patient", "family"):
        default_rooms.append(f"patient-{user.id}")

    await manager.connect(websocket, user_id)
    manager.subscribe(user_id, default_rooms)

    try:
        # Send welcome + current online count
        await manager.send_to_user(user_id, "connected", {
            "user_id": user_id,
            "rooms": default_rooms,
            "online_users": manager.online_count,
        })

        while True:
            try:
                raw = await asyncio.wait_for(websocket.receive_text(), timeout=60)
            except asyncio.TimeoutError:
                # Send ping to keep connection alive
                try:
                    await websocket.send_text(json.dumps({"event": "ping", "data": {}}))
                except Exception:
                    break
                continue

            try:
                msg = json.loads(raw)
                event = msg.get("event")
                data  = msg.get("data", {})

                if event == "subscribe":
                    rooms = data.get("rooms", [])
                    manager.subscribe(user_id, rooms)
                    await manager.send_to_user(user_id, "subscribed", {"rooms": rooms})

                elif event == "unsubscribe":
                    rooms = data.get("rooms", [])
                    manager.unsubscribe(user_id, rooms)

                elif event == "pong":
                    pass  # keepalive acknowledged

                elif event == "join_patient_room":
                    pid = data.get("patient_id")
                    if pid and user.role in ("clinician", "admin", "caregiver"):
                        manager.subscribe(user_id, [f"patient-{pid}"])
                        await manager.send_to_user(user_id, "room_joined", {"room": f"patient-{pid}"})

            except json.JSONDecodeError:
                pass

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.warning(f"WS error for user {user_id}: {e}")
    finally:
        manager.disconnect(websocket, user_id)


# ── Helper: verify token without FastAPI dependency ───────────────────────
def verify_token(token: str, db):
    """Standalone token verification for WebSocket (no Request object).
    Uses the same SECRET_KEY as auth.py to ensure consistency.
    """
    from jose import jwt, JWTError
    import os
    # Must match auth.py - prefer SECRET_KEY, fall back to JWT_SECRET_KEY, then hardcoded default
    SECRET = os.getenv(
        "SECRET_KEY",
        os.getenv("JWT_SECRET_KEY", "a3f8e2d1c4b7a0f9e6d3c8b5a2f7e4d1c9b6a3f0e7d4c1b8a5f2e9d6c3b0a7")
    )
    ALGO = "HS256"
    try:
        payload = jwt.decode(token, SECRET, algorithms=[ALGO])
        user_id = int(payload.get("sub"))
        from src.db import User as UserModel
        user = db.query(UserModel).filter(UserModel.id == user_id).first()
        return user
    except (JWTError, Exception) as e:
        logger.warning(f"WS token verify failed: {e}")
        return None


# ── Convenience push functions (import from other modules) ─────────────────
async def push_new_alert(alert_data: dict, target_roles=("clinician", "admin")):
    """Push a new alert to all clinicians/admins."""
    await manager.broadcast_to_room("clinicians", "new_alert", alert_data)

async def push_alert_update(alert_id: int, status: str):
    await manager.broadcast_to_room("clinicians", "alert_update", {"alert_id": alert_id, "status": status})

async def push_new_message(conversation_id: int, message_data: dict, recipient_ids: list):
    for uid in recipient_ids:
        await manager.send_to_user(uid, "new_message", {
            "conversation_id": conversation_id,
            "message": message_data,
        })

async def push_notification(user_id: int, notification_data: dict):
    await manager.send_to_user(user_id, "new_notification", notification_data)

async def push_vital_update(patient_id: int, vitals: dict):
    await manager.broadcast_to_room(f"patient-{patient_id}", "vital_update", {
        "patient_id": patient_id, "vitals": vitals,
    })
    await manager.broadcast_to_room("clinicians", "vital_update", {
        "patient_id": patient_id, "vitals": vitals,
    })

async def push_patient_status(patient_id: int, status: str, risk_level: str):
    await manager.broadcast_to_room("clinicians", "patient_status", {
        "patient_id": patient_id, "status": status, "risk_level": risk_level,
    })
