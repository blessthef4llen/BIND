from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import router

app = FastAPI(
    title="Pulse Backend API",
    version="1.0.0"
)

# CORS: allow frontend to connect during development/hackathon
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # later you can restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# All app routes live in routes.py under /api
app.include_router(router, prefix="/api")


@app.get("/")
def root():
    return {"message": "Pulse backend running"}


@app.get("/api/health")
def health():
    return {"status": "ok"}