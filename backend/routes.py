"""
routes.py — All API routes for Pulse backend

GET  /api/health
POST /api/prep               — Agent 1: visit prep
POST /api/extract            — Agent 2: note extraction
POST /api/categorize         — Agent 3: specialist categorizer

GET  /api/concerns           — list active concerns
POST /api/concerns           — log new concern (auto-categorizes)
PATCH /api/concerns/{id}     — edit concern fields
DELETE /api/concerns/{id}    — hard delete
POST /api/concerns/{id}/archive   — soft archive
POST /api/concerns/{id}/restore   — restore from archive
GET  /api/concerns/archived  — list archived concerns

GET  /api/timeline           — list active timeline entries
POST /api/timeline           — save extracted note to timeline
POST /api/timeline/{id}/archive
POST /api/timeline/{id}/restore

POST /api/run-agent-chain    — Demo: 3-agent chain
"""

import os
from datetime import date
from typing import List

from fastapi import APIRouter, HTTPException

from models import (
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
import storage

router = APIRouter()


# ── Health ────────────────────────────────────────────────────────────────────

@router.get("/health")
def health():
    api_key    = os.getenv("IBM_API_KEY", "")
    project_id = os.getenv("IBM_PROJECT_ID", "")
    url        = os.getenv("IBM_URL", "")
    granite_ready = bool(api_key and project_id and url)
    return {"status": "ok", "granite_ready": granite_ready}


# ── AI Agents ─────────────────────────────────────────────────────────────────

@router.post("/prep", response_model=VisitPrepResponse)
def visit_prep(data: ConcernInput):
    """Agent 1: Generate visit prep from a concern log."""
    return generate_visit_prep(data.model_dump())


@router.post("/extract", response_model=ExtractNoteResponse)
def extract_note(data: ExtractNoteInput):
    """Agent 2: Extract structured info from doctor note text."""
    return extract_doctor_note(data.text)


@router.post("/categorize", response_model=CategorizeResponse)
def categorize(data: CategorizeInput):
    """Agent 3: Suggest specialist category for a concern."""
    return categorize_concern(
        body_area=data.body_area,
        description=data.description,
        urgency=data.urgency or "low",
    )


# ── Concerns ──────────────────────────────────────────────────────────────────

@router.get("/concerns")
def list_concerns():
    return {"concerns": storage.get_all_concerns()}


@router.get("/concerns/archived")
def list_archived_concerns():
    return {"concerns": storage.get_archived_concerns()}


@router.post("/concerns", response_model=ConcernLogResponse, status_code=201)
def log_concern(data: ConcernLog):
    """Log a new concern. Auto-runs categorizer agent."""
    payload = data.model_dump()
    if not payload.get("symptom_date"):
        payload["symptom_date"] = date.today().isoformat()
    payload.setdefault("severity", 5)
    payload.setdefault("notes", "")

    # Auto-categorize unless already provided
    if payload.get("category") in (None, "General", ""):
        cat = categorize_concern(
            body_area   = payload.get("body_area", ""),
            description = payload.get("symptom", ""),
            urgency     = payload.get("urgency_level", "low"),
        )
        payload["category"]            = cat["category"]
        payload["category_confidence"] = cat["confidence"]

    return storage.add_concern(payload)


@router.patch("/concerns/{concern_id}", response_model=ConcernLogResponse)
def edit_concern(concern_id: str, data: ConcernUpdateInput):
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    updated = storage.update_concern(concern_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Concern not found or is archived")
    return updated


@router.delete("/concerns/{concern_id}", status_code=204)
def delete_concern(concern_id: str):
    if not storage.delete_concern(concern_id):
        raise HTTPException(status_code=404, detail="Concern not found")
    return None


@router.post("/concerns/{concern_id}/archive", status_code=200)
def archive_concern(concern_id: str):
    if not storage.archive_concern(concern_id):
        raise HTTPException(status_code=404, detail="Concern not found or already archived")
    return {"status": "archived"}


@router.post("/concerns/{concern_id}/restore", status_code=200)
def restore_concern(concern_id: str):
    if not storage.restore_concern(concern_id):
        raise HTTPException(status_code=404, detail="Concern not found or not archived")
    return {"status": "restored"}


# ── Timeline ──────────────────────────────────────────────────────────────────

@router.get("/timeline")
def get_timeline():
    return {"timeline": storage.get_all_timeline()}


@router.post("/timeline", response_model=TimelineEntryResponse, status_code=201)
def save_timeline_entry(data: TimelineEntryInput):
    return storage.add_timeline_entry(data.model_dump())


@router.post("/timeline/{entry_id}/archive", status_code=200)
def archive_timeline(entry_id: str):
    if not storage.archive_timeline_entry(entry_id):
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"status": "archived"}


@router.post("/timeline/{entry_id}/restore", status_code=200)
def restore_timeline(entry_id: str):
    if not storage.restore_timeline_entry(entry_id):
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"status": "restored"}


# ── Demo: 3-Agent Chain ───────────────────────────────────────────────────────

@router.post("/run-agent-chain", response_model=AgentChainResponse)
def run_agent_chain(data: AgentChainInput):
    """Demo: Check-in → Pattern Detection → Visit Prep"""

    # Step 1: Check-in / log
    cat = categorize_concern(data.body_area, data.symptom, data.urgency_level)
    concern_payload = {
        "body_area":            data.body_area,
        "symptom":              data.symptom,
        "urgency_level":        data.urgency_level,
        "severity":             data.severity or 5,
        "notes":                data.notes or "",
        "symptom_date":         date.today().isoformat(),
        "category":             cat["category"],
        "category_confidence":  cat["confidence"],
    }
    saved = storage.add_concern(concern_payload)

    # Step 2: Pattern detection
    prior = [
        c for c in storage.get_all_concerns()
        if c.get("body_area", "").lower() == data.body_area.lower()
        and c.get("id") != saved["id"]
    ]
    pattern = detect_pattern(prior, saved)

    # Step 3: Visit prep
    prep_input = {
        "body_area":           data.body_area,
        "start_time":          "",
        "concern_description": data.symptom,
        "urgency":             data.urgency_level,
        "additional_message":  f"Pattern: {pattern['pattern_summary']} Escalation: {pattern['escalation_level']}.",
    }
    prep_raw = generate_visit_prep(prep_input)

    esc = pattern["escalation_level"]
    if esc not in ("monitor", "see_doctor", "urgent"):
        esc = "monitor"

    return AgentChainResponse(
        step1_checkin   = ConcernLogResponse(**saved),
        step2_pattern   = PatternResult(**pattern),
        step3_visit_prep = VisitPrepChainResult(
            concern_summary      = prep_raw.get("symptom_summary", data.symptom),
            escalation_decision  = esc,
            escalation_reason    = pattern["pattern_summary"],
            suggested_questions  = prep_raw.get("questions_to_ask", []),
        ),
    )