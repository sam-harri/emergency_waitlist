from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import init_postgres, close_postgres
from routers import admin_router, patient_router, websocket_router, BroadcastMiddleware
import uvicorn

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_postgres()
    yield
    close_postgres()

app : FastAPI = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(BroadcastMiddleware)

app.include_router(admin_router, prefix="/admin", tags=["admin"])
app.include_router(patient_router, prefix="/patient", tags=["patient"])
app.include_router(websocket_router, tags=["websockets"])


@app.get(path="/ping")
def ping():
    return {"status": "active"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)