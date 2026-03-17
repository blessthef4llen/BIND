"""
main.py — Pulse FastAPI backend entry point

Start with: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import router

app = FastAPI(
    title="Pulse Backend API",
    description="IBM Granite-powered health companion backend",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Tighten for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/")
def root():
    return {
        "message": "Pulse backend running",
        "docs":    "/docs",
        "health":  "/api/health",
    }