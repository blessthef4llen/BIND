import os
from pathlib import Path

from fastapi import APIRouter
<<<<<<< HEAD

from models import (
    ConcernInput,
    VisitPrepResponse,
    ExtractNoteInput,
    ExtractNoteResponse,
)
=======
from fastapi.responses import FileResponse
>>>>>>> 71991e0d917ac06ebc2d069340b9455e9efcf960
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
<<<<<<< HEAD
def get_timeline():
    """
    Placeholder timeline route.
    This will later return saved post-visit records only.
    """
    return {"timeline": []}
=======
def timeline():
    return {
        "timeline": []
    }


@router.get("/orchestrate-chat")
def orchestrate_chat_page():
    return FileResponse(STATIC_DIR / "orchestrate-chat.html")


@router.get("/orchestrate-chat/config")
def orchestrate_chat_config():
    return {
        "hostURL": os.getenv("ORCHESTRATE_HOST_URL", "https://dl.watson-orchestrate.ibm.com"),
        "orchestrationID": os.getenv("ORCHESTRATE_ORCHESTRATION_ID", ""),
        "agentId": os.getenv("ORCHESTRATE_AGENT_ID", ""),
        "agentEnvironmentId": os.getenv("ORCHESTRATE_AGENT_ENVIRONMENT_ID", ""),
        "deploymentPlatform": os.getenv("ORCHESTRATE_DEPLOYMENT_PLATFORM", "ibmcloud"),
        "crn": os.getenv("ORCHESTRATE_CRN", ""),
        "showLauncher": os.getenv("ORCHESTRATE_SHOW_LAUNCHER", "false").lower() == "true",
        "defaultLocale": os.getenv("ORCHESTRATE_DEFAULT_LOCALE", "en"),
        "layout": {
            "form": os.getenv("ORCHESTRATE_CHAT_FORM", "fullscreen-overlay"),
            "showOrchestrateHeader": os.getenv("ORCHESTRATE_SHOW_ORCHESTRATE_HEADER", "true").lower() == "true",
            "width": os.getenv("ORCHESTRATE_CHAT_WIDTH", "100%"),
            "height": os.getenv("ORCHESTRATE_CHAT_HEIGHT", "100%"),
        },
        "tokenEndpoint": os.getenv("ORCHESTRATE_TOKEN_ENDPOINT", ""),
    }
>>>>>>> 71991e0d917ac06ebc2d069340b9455e9efcf960
