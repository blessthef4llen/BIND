# ─────────────────────────────────────────────
#  prep_agent.py
#
#  TO PLUG IN IBM GRANITE:
#    1. pip install ibm-watsonx-ai python-dotenv
#    2. Add IBM_API_KEY, IBM_PROJECT_ID, IBM_URL to .env
#    3. Uncomment the GRANITE block below and delete the stub return
# ─────────────────────────────────────────────

# ── GRANITE BLOCK (uncomment when ready) ─────────────────────────────────────
# import os, json
# from dotenv import load_dotenv
# from ibm_watsonx_ai import Credentials
# from ibm_watsonx_ai.foundation_models import ModelInference
#
# load_dotenv()
# _model = ModelInference(
#     model_id="ibm/granite-4-h-small",
#     credentials=Credentials(api_key=os.getenv("IBM_API_KEY"), url=os.getenv("IBM_URL")),
#     project_id=os.getenv("IBM_PROJECT_ID"),
#     params={"decoding_method": "greedy", "max_new_tokens": 300, "temperature": 0},
# )
#
# def _call_granite(prompt: str) -> dict:
#     raw = _model.generate_text(prompt=prompt)
#     start, end = raw.find("{"), raw.rfind("}") + 1
#     return json.loads(raw[start:end])
# ─────────────────────────────────────────────────────────────────────────────


def generate_visit_prep(concerns: list, pattern: dict) -> dict:
    """
    Given a list of concern dicts and a pattern-detection result,
    return a visit-prep payload.

    Stub returns realistic demo data.  Replace body with _call_granite() when ready.
    """

    # ── STUB ──────────────────────────────────────────────────────────────────
    body_area   = concerns[-1].get("body_area", "affected area") if concerns else "affected area"
    symptom     = concerns[-1].get("symptom",  "ongoing pain")   if concerns else "ongoing pain"
    esc_level   = pattern.get("escalation_level", "see_doctor")
    esc_reason  = (
        "Severity has escalated from 3/10 to 8/10 over 7 days with no improvement, "
        "and you are now unable to walk normally."
    )

    return {
        "concern_summary": (
            f"You have logged {len(concerns)} entries over the past week related to your {body_area}. "
            f"Most recently: {symptom}. The pattern shows a clear upward severity trend."
        ),
        "escalation_decision": esc_level,
        "escalation_reason":   esc_reason,
        "suggested_questions": [
            f"What is causing the escalating pain in my {body_area}?",
            "Is this likely muscular, structural, or nerve-related?",
            "Should I get imaging done given the severity and duration?",
            "What treatments or at-home care are safe to start now?",
            "Could the arch pain and swelling be related to my ankle issue?",
        ],
        "concerns_to_mention": [
            {"area": body_area,    "urgency": "high"},
            {"area": "Left Foot",  "urgency": "medium"},
        ],
    }
    # ── END STUB ──────────────────────────────────────────────────────────────
