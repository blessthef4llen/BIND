import os
from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import FileResponse
from agents.prep_agent import generate_visit_prep
from agents.extractor_agent import extract_doctor_note

router = APIRouter()
STATIC_DIR = Path(__file__).parent / "static"

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
