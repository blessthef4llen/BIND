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

def generate_visit_prep(user_input: str):
    try:
        prompt = f"""
        A patient reports the following symptoms:
        {user_input}

        Generate:
        1. A short summary
        2. Questions
        3. Concerns
        """

        response = model.generate_text(prompt)

        return {
            "symptom_summary": response,
            "questions_to_ask": [],
            "concerns_to_mention": []
        }

    except Exception as e:
        print("AI ERROR:", e)

        # fallback (IMPORTANT for demo)
        return {
            "symptom_summary": "Mock summary",
            "questions_to_ask": ["What could be causing this?"],
            "concerns_to_mention": ["Duration of symptoms"]
        }