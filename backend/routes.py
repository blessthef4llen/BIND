"""
routes.py — Complete Pulse API (final)

AUTH
  POST /api/auth/signup
  POST /api/auth/login
  GET  /api/auth/me

HEALTH
  GET  /api/health

AI AGENTS (no auth needed for demo)
  POST /api/prep
  POST /api/extract
  POST /api/categorize

CONCERNS (auth required)
  GET    /api/concerns
  GET    /api/concerns/archived
  POST   /api/concerns
  PATCH  /api/concerns/{id}
  DELETE /api/concerns/{id}
  POST   /api/concerns/{id}/archive
  POST   /api/concerns/{id}/restore

TIMELINE (auth required)
  GET  /api/timeline
  POST /api/timeline
  POST /api/timeline/{id}/archive
  POST /api/timeline/{id}/restore
  GET  /api/timeline/{id}/uploads

UPLOADS (auth required)
  POST /api/upload
  GET  /api/uploads
  GET  /api/uploads/{id}/download

REPORTS (auth required)
  POST /api/timeline/{id}/report   — generate + stream PDF

DEMO
  POST /api/run-agent-chain
"""

import os, shutil, uuid
from datetime import date
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Query
from fastapi.responses import FileResponse, Response

import database as db
from auth import create_token, get_current_user, decode_token
from models import (
    SignupInput, LoginInput, AuthResponse,
    ConcernInput, VisitPrepResponse,
    ExtractNoteInput, ExtractNoteResponse,
    CategorizeInput, CategorizeResponse,
    ConcernLog, ConcernLogResponse, ConcernUpdateInput,
    TimelineEntryInput, TimelineEntryResponse,
    AgentChainInput, AgentChainResponse,
    PatternResult, VisitPrepChainResult,
)
from agents.prep_agent import generate_visit_prep
from agents.extractor_agent import extract_doctor_note
from agents.categorizer_agent import categorize_concern
from agents.pattern_agent import detect_pattern
from pdf_report import generate_report_bytes

router = APIRouter()

ALLOWED_MIME = {
    "application/pdf",
    "image/jpeg", "image/jpg", "image/png",
    "image/heic", "image/heif", "image/webp",
}
MAX_MB = 20


# ── Auth ──────────────────────────────────────────────────────────────────────

@router.post("/auth/signup", response_model=AuthResponse)
def signup(data: SignupInput):
    if len(data.pin) < 4:
        raise HTTPException(400, "PIN must be at least 4 digits")
    user = db.create_user(data.username, data.pin)
    if not user:
        raise HTTPException(409, "Username already taken")
    return {"token": create_token(user["id"], user["username"]),
            "user_id": user["id"], "username": user["username"]}


@router.post("/auth/login", response_model=AuthResponse)
def login(data: LoginInput):
    user = db.verify_user(data.username, data.pin)
    if not user:
        raise HTTPException(401, "Invalid username or PIN")
    return {"token": create_token(user["id"], user["username"]),
            "user_id": user["id"], "username": user["username"]}


@router.get("/auth/me")
def me(user: dict = Depends(get_current_user)):
    return {"user_id": user["id"], "username": user["username"]}


# ── Health ────────────────────────────────────────────────────────────────────

@router.get("/health")
def health():
    ready = bool(os.getenv("IBM_API_KEY") and os.getenv("IBM_PROJECT_ID") and os.getenv("IBM_URL"))
    return {"status": "ok", "granite_ready": ready}


# ── AI Agents (no auth — demo-safe) ──────────────────────────────────────────

@router.post("/prep", response_model=VisitPrepResponse)
def visit_prep(data: ConcernInput):
    return generate_visit_prep(data.model_dump())


@router.post("/extract", response_model=ExtractNoteResponse)
def extract_note(data: ExtractNoteInput):
    return extract_doctor_note(data.text)


@router.post("/categorize", response_model=CategorizeResponse)
def categorize(data: CategorizeInput):
    return categorize_concern(data.body_area, data.description, data.urgency or "low")


# ── Concerns ─────────────────────────────────────────────────────────────────

@router.get("/concerns")
def list_concerns(user: dict = Depends(get_current_user)):
    return {"concerns": db.get_all_concerns(user["id"])}


@router.get("/concerns/archived")
def list_archived(user: dict = Depends(get_current_user)):
    return {"concerns": db.get_archived_concerns(user["id"])}


@router.post("/concerns", response_model=ConcernLogResponse, status_code=201)
def log_concern(data: ConcernLog, user: dict = Depends(get_current_user)):
    payload = data.model_dump()
    if not payload.get("symptom_date"):
        payload["symptom_date"] = date.today().isoformat()
    # Auto-categorize only when user didn't override
    if payload.get("category") in (None, "General", ""):
        cat = categorize_concern(payload.get("body_area",""), payload.get("symptom",""), payload.get("urgency_level","low"))
        payload["category"]           = cat["category"]
        payload["category_confidence"]= cat["confidence"]
    return db.add_concern(user["id"], payload)


@router.patch("/concerns/{cid}", response_model=ConcernLogResponse)
def edit_concern(cid: str, data: ConcernUpdateInput, user: dict = Depends(get_current_user)):
    updated = db.update_concern(cid, user["id"], data.model_dump(exclude_none=True))
    if not updated:
        raise HTTPException(404, "Concern not found")
    return updated


@router.delete("/concerns/{cid}", status_code=204)
def delete_concern(cid: str, user: dict = Depends(get_current_user)):
    if not db.delete_concern(cid, user["id"]):
        raise HTTPException(404, "Concern not found")
    return None


@router.post("/concerns/{cid}/archive")
def archive_concern(cid: str, user: dict = Depends(get_current_user)):
    if not db.archive_concern(cid, user["id"]):
        raise HTTPException(404, "Concern not found")
    return {"status": "archived"}


@router.post("/concerns/{cid}/restore")
def restore_concern(cid: str, user: dict = Depends(get_current_user)):
    if not db.restore_concern(cid, user["id"]):
        raise HTTPException(404, "Concern not found")
    return {"status": "restored"}


# ── Timeline ──────────────────────────────────────────────────────────────────

@router.get("/timeline")
def get_timeline(user: dict = Depends(get_current_user)):
    return {"timeline": db.get_all_timeline(user["id"])}


@router.post("/timeline", response_model=TimelineEntryResponse, status_code=201)
def save_timeline(data: TimelineEntryInput, user: dict = Depends(get_current_user)):
    return db.add_timeline_entry(user["id"], data.model_dump())


@router.post("/timeline/{eid}/archive")
def archive_timeline(eid: str, user: dict = Depends(get_current_user)):
    if not db.archive_timeline_entry(eid, user["id"]):
        raise HTTPException(404, "Entry not found")
    return {"status": "archived"}


@router.post("/timeline/{eid}/restore")
def restore_timeline(eid: str, user: dict = Depends(get_current_user)):
    if not db.restore_timeline_entry(eid, user["id"]):
        raise HTTPException(404, "Entry not found")
    return {"status": "restored"}


@router.get("/timeline/{eid}/uploads")
def get_timeline_uploads(eid: str, user: dict = Depends(get_current_user)):
    return {"uploads": db.get_uploads_for_timeline(user["id"], eid)}


# ── File Uploads ──────────────────────────────────────────────────────────────

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    linked_timeline_id: Optional[str] = Form(None),
    user: dict = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(400, f"Unsupported file type: {file.content_type}")
    contents = await file.read()
    if len(contents) / (1024*1024) > MAX_MB:
        raise HTTPException(413, f"File too large (max {MAX_MB}MB)")
    ext       = os.path.splitext(file.filename or "upload")[1] or ".bin"
    safe_name = f"{uuid.uuid4().hex}{ext}"
    dest      = os.path.join(db.UPLOADS_DIR, safe_name)
    with open(dest, "wb") as f:
        f.write(contents)
    return db.save_upload_meta(user["id"], safe_name, file.filename or "upload",
                               file.content_type, len(contents), linked_timeline_id)


@router.get("/uploads")
def list_uploads(user: dict = Depends(get_current_user)):
    return {"uploads": db.get_uploads_for_user(user["id"])}


@router.get("/uploads/{uid}/download")
def download_upload(uid: str, user: dict = Depends(get_current_user)):
    with db._conn() as con:
        row = con.execute("SELECT * FROM uploads WHERE id=? AND user_id=?", (uid, user["id"])).fetchone()
    if not row:
        raise HTTPException(404, "Upload not found")
    meta = db._row_to_dict(row)
    path = os.path.join(db.UPLOADS_DIR, meta["filename"])
    if not os.path.exists(path):
        raise HTTPException(404, "File missing on server")
    return FileResponse(path, media_type=meta["mime_type"], filename=meta["original_name"])


# ── PDF Report ────────────────────────────────────────────────────────────────

def _resolve_user_from_token(token: Optional[str]) -> Optional[dict]:
    """Allow token as query param for browser-based PDF download."""
    if not token:
        return None
    payload = decode_token(token)
    if not payload:
        return None
    return db.get_user_by_id(payload["sub"])


@router.api_route("/timeline/{eid}/report", methods=["GET", "POST"])
async def pdf_report_handler(
    eid: str,
    token: Optional[str] = Query(None),
):
    """
    Generate and stream a PDF report for a timeline entry.
    Auth: Bearer token in header (normal API calls) OR ?token= query param
    (for Linking.openURL browser-based download from the mobile app).
    """
    user = _resolve_user_from_token(token)
    if not user:
        raise HTTPException(401, "Authentication required")

    entry = db.get_timeline_entry_by_id(eid)
    if not entry or entry.get("user_id") != user["id"]:
        raise HTTPException(404, "Timeline entry not found")

    pdf_bytes = generate_report_bytes(
        user_name      = user["username"],
        visit_date     = entry.get("visit_date", "Unknown"),
        diagnosis      = entry.get("diagnosis", ""),
        prescriptions  = entry.get("prescriptions", []),
        key_advice     = entry.get("key_advice", []),
        follow_up_date = entry.get("follow_up_date", ""),
    )

    fname = f"pulse_report_{entry.get('visit_date', 'visit')}_{eid[:8]}.pdf"
    if pdf_bytes:
        return Response(content=pdf_bytes, media_type="application/pdf",
                        headers={"Content-Disposition": f"attachment; filename={fname}"})

    # reportlab not installed — plain text fallback
    lines = ["PULSE — Post-Visit Summary", f"Visit: {entry.get('visit_date')}  ·  {user['username']}", "",
             f"Diagnosis: {entry.get('diagnosis')}", "", "Prescriptions:"]
    lines += [f"  - {rx}" for rx in entry.get("prescriptions", [])]
    lines += ["", "Doctor's Advice:"] + [f"  - {t}" for t in entry.get("key_advice", [])]
    lines += ["", f"Follow-up: {entry.get('follow_up_date')}", "",
              "Generated by PULSE · Powered by IBM Granite",
              "AI organizational summary only. Not a medical diagnosis."]
    return Response("\n".join(lines), media_type="text/plain",
                    headers={"Content-Disposition": f"attachment; filename=pulse_report_{eid[:8]}.txt"})


# ── Demo agent chain ──────────────────────────────────────────────────────────

@router.post("/run-agent-chain", response_model=AgentChainResponse)
def run_agent_chain(data: AgentChainInput, user: dict = Depends(get_current_user)):
    cat = categorize_concern(data.body_area, data.symptom, data.urgency_level)
    payload = {
        "body_area": data.body_area, "symptom": data.symptom,
        "urgency_level": data.urgency_level, "severity": data.severity or 5,
        "notes": data.notes or "", "symptom_date": date.today().isoformat(),
        "category": cat["category"], "category_confidence": cat["confidence"],
    }
    saved  = db.add_concern(user["id"], payload)
    prior  = [c for c in db.get_all_concerns(user["id"])
              if c.get("body_area","").lower() == data.body_area.lower() and c.get("id") != saved["id"]]
    pattern = detect_pattern(prior, saved)
    prep    = generate_visit_prep({
        "body_area": data.body_area, "start_time": "",
        "concern_description": data.symptom, "urgency": data.urgency_level,
        "additional_message": f"Pattern: {pattern['pattern_summary']}",
    })
    esc = pattern["escalation_level"]
    if esc not in ("monitor", "see_doctor", "urgent"):
        esc = "monitor"
    return AgentChainResponse(
        step1_checkin    = ConcernLogResponse(**saved),
        step2_pattern    = PatternResult(**pattern),
        step3_visit_prep = VisitPrepChainResult(
            concern_summary     = prep.get("symptom_summary", data.symptom),
            escalation_decision = esc,
            escalation_reason   = pattern["pattern_summary"],
            suggested_questions = prep.get("questions_to_ask", []),
        ),
    )