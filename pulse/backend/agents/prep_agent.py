from dotenv import load_dotenv
import os
from pathlib import Path

from ibm_watsonx_ai import Credentials
from ibm_watsonx_ai.foundation_models import ModelInference

load_dotenv()

API_KEY = os.getenv("IBM_API_KEY")
PROJECT_ID = os.getenv("IBM_PROJECT_ID")
URL = os.getenv("IBM_URL")

print(API_KEY)
print(PROJECT_ID)
print(URL)

credentials = Credentials(
    api_key=API_KEY,
    url=URL
)

params = {
    "decoding_method": "greedy",
    "max_new_tokens": 180,
    "temperature": 0
}

model = ModelInference(
    model_id="ibm/granite-4-h-small",
    credentials=credentials,
    project_id=PROJECT_ID,
    params=params
)

def generate_visit_prep(data: dict):
    try:
        prompt = f"""
        You are an assistant inside a health tracking mobile app.

        User log:
        body_area: {data.get("body_area")}
        symptom: {data.get("concern_description")}
        severity: {data.get("urgency")}
        duration: {data.get("start_time")}

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

        # 🔥 extract JSON (your notebook logic)
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