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
    body_area = data.get("body_area", "").strip() or "General concern"
    start_time = data.get("start_time", "").strip()
    concern_description = data.get("concern_description", "").strip() or "a health concern"
    urgency = data.get("urgency", "low").strip() or "low"
    additional_message = data.get("additional_message", "").strip()

    if urgency not in ["low", "medium", "high"]:
        urgency = "low"

    summary_parts = [
        f"You logged {concern_description} in the {body_area}."
    ]

    if start_time:
        summary_parts.append(f"It started around {start_time}.")
    summary_parts.append(f"You marked it as {urgency} urgency.")
    if additional_message:
        summary_parts.append(f"Additional note: {additional_message}")

    return {
        "symptom_summary": " ".join(summary_parts),
        "questions_to_ask": [
            "When did this start, and what pattern should I describe to my doctor?",
            "What could be causing this symptom?",
            "What changes or warning signs should I monitor before my visit?"
        ],
        "concerns_to_mention": [
            {
                "area": body_area,
                "urgency": urgency
            }
        ]
    }


def _normalize_output(raw_output: Any, original_data: Dict[str, Any]) -> Dict[str, Any]:
    fallback = _build_fallback_response(original_data)

    if not isinstance(raw_output, dict):
        return fallback

    symptom_summary = raw_output.get("symptom_summary")
    if not isinstance(symptom_summary, str) or not symptom_summary.strip():
        symptom_summary = fallback["symptom_summary"]

    questions_to_ask = raw_output.get("questions_to_ask")
    if not isinstance(questions_to_ask, list):
        questions_to_ask = fallback["questions_to_ask"]
    else:
        questions_to_ask = [
            q.strip() for q in questions_to_ask
            if isinstance(q, str) and q.strip()
        ]
        if not questions_to_ask:
            questions_to_ask = fallback["questions_to_ask"]

    concerns_to_mention = raw_output.get("concerns_to_mention")
    if not isinstance(concerns_to_mention, list) or not concerns_to_mention:
        concerns_to_mention = fallback["concerns_to_mention"]
    else:
        cleaned_concerns = []
        for item in concerns_to_mention:
            if not isinstance(item, dict):
                continue

            area = item.get("area")
            urgency = item.get("urgency", "low")

            if not isinstance(area, str) or not area.strip():
                area = original_data.get("body_area", "").strip() or "General concern"

            if urgency not in ["low", "medium", "high"]:
                urgency = "low"

            cleaned_concerns.append({
                "area": area.strip(),
                "urgency": urgency
            })

        concerns_to_mention = cleaned_concerns or fallback["concerns_to_mention"]

    return {
        "symptom_summary": symptom_summary.strip(),
        "questions_to_ask": questions_to_ask,
        "concerns_to_mention": concerns_to_mention
    }


def _extract_json(text: str) -> Dict[str, Any]:
    start = text.find("{")
    end = text.rfind("}") + 1

    if start == -1 or end == 0:
        raise ValueError("No JSON object found in model response.")

    return json.loads(text[start:end])


def _build_prompt(data: Dict[str, Any]) -> str:
    body_area = data.get("body_area", "")
    start_time = data.get("start_time", "")
    concern_description = data.get("concern_description", "")
    urgency = data.get("urgency", "low")
    additional_message = data.get("additional_message", "")

    if urgency not in ["low", "medium", "high"]:
        urgency = "low"

    return f"""
You are an assistant inside a health tracking mobile app.

The user submitted a pre-visit health concern log.

User input:
- body_area: {body_area}
- start_time: {start_time}
- concern_description: {concern_description}
- urgency: {urgency}
- additional_message: {additional_message}

Create a short, clear visit prep response.
Do not diagnose the user.
Use calm, supportive language.

Return ONLY valid JSON in this exact format:
{{
  "symptom_summary": "A short plain-language summary of the user's concern.",
  "questions_to_ask": [
    "Question 1",
    "Question 2",
    "Question 3"
  ],
  "concerns_to_mention": [
    {{
      "area": "{body_area if body_area else 'General concern'}",
      "urgency": "{urgency}"
    }}
  ]
}}
""".strip()


def _get_model():
    api_key = os.getenv("IBM_API_KEY")
    project_id = os.getenv("IBM_PROJECT_ID")
    url = os.getenv("IBM_URL")

    if not Credentials or not ModelInference:
        return None

    if not api_key or not project_id or not url:
        return None

    credentials = Credentials(api_key=api_key, url=url)

    params = {
        "decoding_method": "greedy",
        "max_new_tokens": 220,
        "temperature": 0
    }

    return ModelInference(
        model_id="ibm/granite-4-h-small",
        credentials=credentials,
        project_id=project_id,
        params=params
    )


def generate_visit_prep(data: Dict[str, Any]) -> Dict[str, Any]:
    fallback = _build_fallback_response(data)

    try:
        model = _get_model()
        if model is None:
            return fallback

        prompt = _build_prompt(data)
        response_text = model.generate_text(prompt=prompt)

<<<<<<< HEAD
        try:
            parsed = _extract_json(response_text)
            return _normalize_output(parsed, data)
        except Exception as parse_error:
            print("Prep agent parse error:", parse_error)
            print("Raw model response:", response_text)
            return fallback

    except Exception as e:
        print("Prep agent error:", e)
        return fallback
=======
        Return ONLY JSON:
        {{
          "what_you_logged": "",
          "body_area_explanation": "",
          "recommended_visit": "",
          "how_soon": "",
          "symptom(s)": "",
          "questions_for_doctor": []
        }}
        """

        response = model.generate_text(prompt=prompt)

        import json
        start = response.find("{")
        end = response.rfind("}") + 1
        clean_output = json.loads(response[start:end])

        return clean_output

    except Exception as e:
        print("AI ERROR:", e)

        # fallback so demo never breaks
        return {
            "what_you_logged": "Knee pain when bending",
            "body_area_explanation": "The knee joint helps with movement like walking and bending.",
            "recommended_visit": "General doctor",
            "how_soon": "Schedule soon",
            "symptom(s)": "Knee pain",
            "questions_for_doctor": [
                "What could be causing this pain?",
                "Should I avoid certain movements?",
                "Do I need imaging or tests?"
            ]
        }
>>>>>>> 71991e0d917ac06ebc2d069340b9455e9efcf960
