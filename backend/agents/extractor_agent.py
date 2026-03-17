"""
agents/extractor_agent.py — Post-visit note extraction using IBM Granite

Takes raw doctor note text and returns structured extracted information.
Falls back gracefully to a rule-based parser when IBM is unavailable.
"""

import os
import re
import json
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv

load_dotenv()

try:
    from ibm_watsonx_ai import Credentials
    from ibm_watsonx_ai.foundation_models import ModelInference
except ImportError:
    Credentials = None
    ModelInference = None


# ── Fallback: simple rule-based extraction ───────────────────────────────────

def _fallback_extract(text: str) -> Dict[str, Any]:
    """
    Best-effort rule-based extraction when the model is unavailable.
    Searches for common patterns in doctor note text.
    """
    text_lower = text.lower()

    # Diagnosis — look for "diagnosis:", "dx:", "impression:"
    diagnosis = "See original notes"
    for pattern in [r'(?:diagnosis|dx|impression)[:\s]+([^\n\.]+)', r'presents? with ([^\n\.]{10,60})']:
        m = re.search(pattern, text_lower)
        if m:
            diagnosis = m.group(1).strip().capitalize()
            break

    # Prescriptions — look for common Rx keywords
    prescriptions: List[str] = []
    rx_patterns = [
        r'(?:prescribed?|rx|medication)[:\s]+([^\n]+)',
        r'(\w+(?:\s+\w+)?)\s+(\d+\s*mg)[^\n]*',
    ]
    for pat in rx_patterns:
        for m in re.finditer(pat, text_lower):
            entry = m.group(0).strip().capitalize()
            if len(entry) < 100:
                prescriptions.append(entry)
    prescriptions = list(dict.fromkeys(prescriptions))[:4]  # dedupe, cap at 4

    # Key advice — look for "advised", "recommended", "should", "avoid"
    key_advice: List[str] = []
    for m in re.finditer(r'(?:advised?|recommended?|instructed?|should|avoid)[^\.]{5,80}\.', text_lower):
        entry = m.group(0).strip().capitalize()
        if len(entry) > 10:
            key_advice.append(entry)
    key_advice = key_advice[:5]
    if not key_advice:
        key_advice = ["Follow up with your doctor as discussed."]

    # Follow-up date
    follow_up_date = "As discussed with your doctor"
    for pat in [r'follow[\s\-]?up\s+(?:in\s+)?([^,\n\.]+)', r'return\s+(?:in\s+)?(\d+\s+\w+)']:
        m = re.search(pat, text_lower)
        if m:
            follow_up_date = m.group(1).strip().capitalize()
            break

    return {
        "diagnosis": diagnosis,
        "prescriptions": prescriptions if prescriptions else ["None noted"],
        "key_advice": key_advice,
        "follow_up_date": follow_up_date,
    }


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
        "max_new_tokens": 400,
        "temperature": 0,
    }

    return ModelInference(
        model_id="ibm/granite-4-h-small",
        credentials=credentials,
        project_id=project_id,
        params=params,
    )


# ── Prompt builder ────────────────────────────────────────────────────────────

def _build_prompt(text: str) -> str:
    return f"""
You are a medical document assistant inside a healthcare support app for young adults.

The user has pasted or uploaded text from a doctor visit note, discharge summary, or medical report.

Your job is to extract and organize the key information into a clear, patient-friendly JSON summary.

Doctor note text:
\"\"\"{text[:2000]}\"\"\"

Extract the following and return ONLY valid JSON:
{{
  "diagnosis": "Primary diagnosis or condition noted, in plain language (string)",
  "prescriptions": ["Drug name and dosage, plain language", "..."],
  "key_advice": ["One clear instruction or recommendation per item", "..."],
  "follow_up_date": "When to return or follow up, as stated"
}}

Rules:
- Use plain patient-friendly language
- Do NOT diagnose, interpret, or add opinions
- If information is missing or unclear, use a brief honest placeholder like "Not specified"
- prescriptions must be plain strings (not objects)
- Include up to 5 items in key_advice
- Include up to 4 prescriptions
- Return ONLY the JSON object, nothing else
""".strip()


# ── JSON extraction helper ────────────────────────────────────────────────────

def _extract_json(text: str) -> Dict[str, Any]:
    start = text.find("{")
    end   = text.rfind("}") + 1
    if start == -1 or end == 0:
        raise ValueError("No JSON found in model response")
    return json.loads(text[start:end])


# ── Output normalizer ─────────────────────────────────────────────────────────

def _normalize(raw: Any, fallback: Dict[str, Any]) -> Dict[str, Any]:
    if not isinstance(raw, dict):
        return fallback

    def clean_str(val, default):
        return str(val).strip() if isinstance(val, str) and val.strip() else default

    def clean_list(val, default):
        if not isinstance(val, list):
            return default
        cleaned = [str(item).strip() for item in val if isinstance(item, (str, dict)) and str(item).strip()]
        # flatten dicts (sometimes model returns {"name": "...", ...})
        result = []
        for item in cleaned:
            if item.startswith("{"):
                try:
                    obj = json.loads(item)
                    result.append(obj.get("name") or obj.get("drug") or str(obj))
                except Exception:
                    result.append(item)
            else:
                result.append(item)
        return result if result else default

    return {
        "diagnosis":     clean_str(raw.get("diagnosis"),     fallback["diagnosis"]),
        "prescriptions": clean_list(raw.get("prescriptions"), fallback["prescriptions"]),
        "key_advice":    clean_list(raw.get("key_advice"),    fallback["key_advice"]),
        "follow_up_date":clean_str(raw.get("follow_up_date"), fallback["follow_up_date"]),
    }


# ── Main entry point ──────────────────────────────────────────────────────────

def extract_doctor_note(text: str) -> Dict[str, Any]:
    """
    Extract structured information from raw doctor note text.
    Uses IBM Granite when available, falls back to rule-based extraction.
    """
    if not text or not text.strip():
        return {
            "diagnosis":      "No text provided",
            "prescriptions":  [],
            "key_advice":     ["Please paste your doctor notes to get an AI summary."],
            "follow_up_date": "Not specified",
        }

    fallback = _fallback_extract(text)

    try:
        model = _get_model()
        if model is None:
            print("Extractor: IBM model unavailable, using rule-based fallback")
            return fallback

        prompt        = _build_prompt(text)
        response_text = model.generate_text(prompt=prompt)

        try:
            parsed = _extract_json(response_text)
            return _normalize(parsed, fallback)
        except Exception as parse_err:
            print("Extractor parse error:", parse_err)
            print("Raw model output:", response_text[:500])
            return fallback

    except Exception as e:
        print("Extractor error:", e)
        return fallback