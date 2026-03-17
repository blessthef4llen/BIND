from ibm_watsonx_ai import Credentials
from ibm_watsonx_ai.foundation_models import ModelInference
import json
import os


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