from fastapi import APIRouter
from backend.agents.prep_agent import generate_visit_prep
from backend.agents.extractor_agent import extract_doctor_note

router = APIRouter()

@router.post("/generate-visit-prep")
def visit_prep(data: dict):
    result = generate_visit_prep(data)
    return result

@router.post("/extract-doctor-note")
def extract_note(data: dict):
    text = data.get("text")
    return extract_doctor_note(text)


@router.get("/timeline")
def timeline():
    return {
        "timeline": []
    }