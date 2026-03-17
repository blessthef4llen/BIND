import os
from pathlib import Path

from fastapi import APIRouter

from models import (
    ConcernInput,
    VisitPrepResponse,
    ExtractNoteInput,
    ExtractNoteResponse,
)
from agents.prep_agent import generate_visit_prep
from agents.extractor_agent import extract_doctor_note

router = APIRouter()
STATIC_DIR = Path(__file__).parent / "static"


@router.post("/prep", response_model=VisitPrepResponse)
def visit_prep(data: ConcernInput):
    """
    Agent 1:
    Takes a pre-visit concern log and returns an AI-generated visit prep summary.
    """
    return generate_visit_prep(data.model_dump())


@router.post("/extract", response_model=ExtractNoteResponse)
def extract_note(data: ExtractNoteInput):
    """
    Agent 2:
    Takes doctor note text and returns structured extracted information.
    """
    return extract_doctor_note(data.text)


@router.get("/timeline")
def get_timeline():
    """
    Placeholder timeline route.
    This will later return saved post-visit records only.
    """
    return {"timeline": []}
