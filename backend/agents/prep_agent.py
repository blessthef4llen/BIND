"""
agents/prep_agent.py — Visit prep generation using IBM Granite

Takes a concern log and generates:
  - symptom_summary
  - questions_to_ask
  - concerns_to_mention

Falls back to rule-based generation when IBM is unavailable.
"""

import os
import json
from typing import Any, Dict

from dotenv import load_dotenv
load_dotenv()

try:
    from ibm_watsonx_ai import Credentials
    from ibm_watsonx_ai.foundation_models import ModelInference
except ImportError:
    Credentials = None
    ModelInference = None


def _build_fallback_response(data: Dict[str, Any]) -> Dict[str, Any]:
    body_area   = (data.get("body_area", "") or "General concern").strip()
    start_time  = (data.get("start_time", "") or "").strip()
    description = (data.get("concern_description", "") or "a health concern").strip()
    urgency     = (data.get("urgency", "low") or "low").strip().lower()
    extra       = (data.get("additional_message", "") or "").strip()

    if urgency not in ("low", "medium", "high"):
        urgency = "low"

    parts = [f"You logged {description} in the {body_area}."]
    if start_time:
        parts.append(f"It started around {start_time}.")
    parts.append(f"You marked it as {urgency} urgency.")
    if extra:
        parts.append(f"Additional note: {extra}")

    return {
        "symptom_summary": " ".join(parts),
        "questions_to_ask": [
            "When did this start, and what pattern should I describe to my doctor?",
            "What could be causing this symptom?",
            "What changes or warning signs should I monitor before my visit?",
        ],
        "concerns_to_mention": [{"area": body_area, "urgency": urgency}],
    }


def _build_prompt(data: Dict[str, Any]) -> str:
    body_area   = (data.get("body_area", "") or "General concern").strip()
    start_time  = (data.get("start_time", "") or "").strip()
    description = (data.get("concern_description", "") or "").strip()
    urgency     = (data.get("urgency", "low") or "low").strip().lower()
    extra       = (data.get("additional_message", "") or "").strip()
    if urgency not in ("low", "medium", "high"):
        urgency = "low"

    return f"""You are an assistant inside a health tracking mobile app.
The user submitted a pre-visit concern log.

User input:
- body_area: {body_area}
- start_time: {start_time}
- concern_description: {description}
- urgency: {urgency}
- additional_message: {extra}

Create a short, clear visit prep response. Do not diagnose. Use calm, supportive language.

Return ONLY valid JSON:
{{
  "symptom_summary": "A short plain-language summary of the user's concern.",
  "questions_to_ask": ["Question 1", "Question 2", "Question 3"],
  "concerns_to_mention": [{{"area": "{body_area}", "urgency": "{urgency}"}}]
}}""".strip()


def _extract_json(text: str) -> Dict[str, Any]:
    start = text.find("{")
    end   = text.rfind("}") + 1
    if start == -1 or end == 0:
        raise ValueError("No JSON in response")
    return json.loads(text[start:end])


def _normalize_output(raw: Any, data: Dict[str, Any]) -> Dict[str, Any]:
    fallback = _build_fallback_response(data)
    if not isinstance(raw, dict):
        return fallback

    summary = raw.get("symptom_summary", "")
    if not isinstance(summary, str) or not summary.strip():
        summary = fallback["symptom_summary"]

    questions = raw.get("questions_to_ask", [])
    if not isinstance(questions, list):
        questions = fallback["questions_to_ask"]
    else:
        questions = [q.strip() for q in questions if isinstance(q, str) and q.strip()]
        if not questions:
            questions = fallback["questions_to_ask"]

    concerns = raw.get("concerns_to_mention", [])
    if not isinstance(concerns, list) or not concerns:
        concerns = fallback["concerns_to_mention"]
    else:
        clean = []
        for item in concerns:
            if not isinstance(item, dict):
                continue
            area    = item.get("area", data.get("body_area", "General")).strip()
            urgency = str(item.get("urgency", "low")).strip().lower()
            if urgency not in ("low", "medium", "high"):
                urgency = "low"
            clean.append({"area": area, "urgency": urgency})
        concerns = clean or fallback["concerns_to_mention"]

    return {"symptom_summary": summary.strip(), "questions_to_ask": questions, "concerns_to_mention": concerns}


def _get_model():
    api_key    = os.getenv("IBM_API_KEY")
    project_id = os.getenv("IBM_PROJECT_ID")
    url        = os.getenv("IBM_URL")
    if not Credentials or not ModelInference or not api_key or not project_id or not url:
        return None
    creds  = Credentials(api_key=api_key, url=url)
    params = {"decoding_method": "greedy", "max_new_tokens": 220, "temperature": 0}
    return ModelInference(model_id="ibm/granite-4-h-small", credentials=creds,
                          project_id=project_id, params=params)


def generate_visit_prep(data: Dict[str, Any]) -> Dict[str, Any]:
    fallback = _build_fallback_response(data)
    try:
        model = _get_model()
        if model is None:
            return fallback
        prompt = _build_prompt(data)
        raw    = model.generate_text(prompt=prompt)
        try:
            parsed = _extract_json(raw)
            return _normalize_output(parsed, data)
        except Exception as e:
            print(f"prep_agent parse error: {e} | raw: {raw[:200]}")
            return fallback
    except Exception as e:
        print(f"prep_agent error: {e}")
        return fallback