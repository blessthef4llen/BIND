from pydantic import BaseModel
from typing import List, Optional, Literal


class ConcernInput(BaseModel):
    body_area: str
    start_time: Optional[str] = ""
    concern_description: str
    urgency: Literal["low", "medium", "high"]
    additional_message: Optional[str] = ""


class ConcernMention(BaseModel):
    area: str
    urgency: Literal["low", "medium", "high"]


class VisitPrepResponse(BaseModel):
    symptom_summary: str
    questions_to_ask: List[str]
    concerns_to_mention: List[ConcernMention]


class ExtractNoteInput(BaseModel):
    text: str


class ExtractNoteResponse(BaseModel):
    diagnosis: str
    prescriptions: List[str]
    key_advice: List[str]
    follow_up_date: str