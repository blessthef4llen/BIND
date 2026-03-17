"""
agents/categorizer_agent.py — AI-powered concern category / specialist suggester

Given a symptom description and body area, suggests the most relevant type of
healthcare provider or care category.

Uses IBM Granite when available. Falls back to keyword-based logic.
Always returns a result — never crashes.
"""

import os
import json
import re
from typing import Any, Dict, Optional

from dotenv import load_dotenv

load_dotenv()

try:
    from ibm_watsonx_ai import Credentials
    from ibm_watsonx_ai.foundation_models import ModelInference
except ImportError:
    Credentials = None
    ModelInference = None


# ── Valid categories ──────────────────────────────────────────────────────────

VALID_CATEGORIES = [
    "Primary Care",
    "Dentist",
    "Dermatologist",
    "Mental Health",
    "Gynecologist",
    "Optometrist",
    "Urgent Care",
    "Orthopedics",
    "General",
]


# ── Keyword fallback map ──────────────────────────────────────────────────────

_KEYWORD_MAP = {
    "Dentist":        ["tooth", "teeth", "gum", "jaw", "dental", "mouth pain", "toothache", "cavity"],
    "Dermatologist":  ["skin", "rash", "acne", "itch", "hive", "bump", "mole", "eczema", "breakout"],
    "Mental Health":  ["anxiety", "depressed", "depression", "stress", "panic", "mood", "mental", "sad", "sleep", "insomnia", "overwhelmed"],
    "Gynecologist":   ["period", "menstrual", "cramp", "vaginal", "ovarian", "cervical", "pelvic", "reproductive"],
    "Optometrist":    ["eye", "vision", "blur", "sight", "glasses", "contact", "headache from screen"],
    "Urgent Care":    ["chest pain", "shortness of breath", "severe", "emergency", "urgent", "cannot breathe", "broken", "fracture", "high fever", "fainting"],
    "Orthopedics":    ["bone", "joint", "knee", "ankle", "shoulder", "back pain", "spine", "ligament", "tendon", "fracture", "sprain"],
    "Primary Care":   ["fever", "cold", "flu", "cough", "infection", "fatigue", "tired", "general", "checkup", "blood pressure", "diabetes"],
}


def _keyword_categorize(body_area: str, description: str) -> str:
    combined = f"{body_area} {description}".lower()

    # Urgent override first
    urgent_words = ["chest pain", "shortness of breath", "cannot breathe", "severe bleeding", "fainting", "high fever", "unable to walk"]
    if any(w in combined for w in urgent_words):
        return "Urgent Care"

    scores: Dict[str, int] = {cat: 0 for cat in VALID_CATEGORIES}
    for category, keywords in _KEYWORD_MAP.items():
        for kw in keywords:
            if kw in combined:
                scores[category] += 1

    best = max(scores, key=lambda c: scores[c])
    return best if scores[best] > 0 else "Primary Care"


# ── Model setup ───────────────────────────────────────────────────────────────

def _get_model() -> Optional[Any]:
    api_key    = os.getenv("IBM_API_KEY")
    project_id = os.getenv("IBM_PROJECT_ID")
    url        = os.getenv("IBM_URL")

    if not Credentials or not ModelInference:
        return None
    if not api_key or not project_id or not url:
        return None

    credentials = Credentials(api_key=api_key, url=url)
    params = {
        "decoding_method": "greedy",
        "max_new_tokens":  80,   # short output — just a category + confidence
        "temperature":     0,
    }

    return ModelInference(
        model_id="ibm/granite-4-h-small",
        credentials=credentials,
        project_id=project_id,
        params=params,
    )


# ── Prompt ────────────────────────────────────────────────────────────────────

def _build_prompt(body_area: str, description: str, urgency: str) -> str:
    categories_list = ", ".join(f'"{c}"' for c in VALID_CATEGORIES)
    return f"""
You are a healthcare triage assistant inside a mobile app for young adults.

The user logged a health concern. Your job is to suggest the most appropriate type of healthcare provider or care setting.

User concern:
- Body area: {body_area or "Not specified"}
- Description: {description or "Not specified"}
- Urgency: {urgency or "low"}

Valid categories: {categories_list}

Rules:
- If urgent keywords appear (chest pain, can't breathe, severe bleeding), return "Urgent Care"
- Match to the most specific specialist when possible
- If unsure, return "Primary Care"
- Confidence should be "high", "medium", or "low"

Return ONLY valid JSON:
{{
  "category": "<one of the valid categories>",
  "confidence": "high" | "medium" | "low",
  "reason": "One short sentence explaining why"
}}
""".strip()


# ── Main entry ────────────────────────────────────────────────────────────────

def categorize_concern(
    body_area: str,
    description: str,
    urgency: str = "low",
) -> Dict[str, Any]:
    """
    Returns:
      {
        "category": "Primary Care",
        "confidence": "medium",
        "reason": "General symptoms without specific specialist indicators."
      }
    """
    keyword_guess = _keyword_categorize(body_area, description)

    try:
        model = _get_model()
        if model is None:
            return {
                "category":   keyword_guess,
                "confidence": "medium",
                "reason":     "Suggested based on your symptoms and body area.",
            }

        prompt        = _build_prompt(body_area, description, urgency)
        response_text = model.generate_text(prompt=prompt)

        start = response_text.find("{")
        end   = response_text.rfind("}") + 1
        if start == -1 or end == 0:
            raise ValueError("No JSON in response")

        parsed = json.loads(response_text[start:end])

        category   = parsed.get("category", keyword_guess)
        confidence = parsed.get("confidence", "medium")
        reason     = parsed.get("reason", "Suggested based on your symptoms.")

        # Validate category
        if category not in VALID_CATEGORIES:
            category = keyword_guess

        if confidence not in ("high", "medium", "low"):
            confidence = "medium"

        return {
            "category":   category,
            "confidence": confidence,
            "reason":     str(reason).strip(),
        }

    except Exception as e:
        print("Categorizer error:", e)
        return {
            "category":   keyword_guess,
            "confidence": "low",
            "reason":     "Suggested based on your symptoms and body area.",
        }