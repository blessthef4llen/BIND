"""
main.py — Pulse FastAPI entry point

Start: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import database as db
from routes import router

# Create SQLite tables on first run (safe to call every startup)
db.init_db()

app = FastAPI(
    title="Pulse Backend API",
    description="IBM Granite-powered health companion",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/")
def root():
    return {"message": "Pulse backend running", "docs": "/docs"}