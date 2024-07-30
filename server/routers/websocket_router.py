from fastapi import Request, Response,  APIRouter, WebSocket, WebSocketDisconnect
from typing import List
from loguru import logger
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.base import RequestResponseEndpoint

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

class BroadcastMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)
        if request.method in ["POST", "PUT", "DELETE"]:
            logger.info("Broadcasting update to all clients")
            await manager.broadcast("update")
        return response

manager = ConnectionManager()


websocket_router = APIRouter()

@websocket_router.websocket("/ws/admin")
async def websocket_admin(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@websocket_router.websocket("/ws/patient/{code}")
async def websocket_patient(websocket: WebSocket, code: str):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
