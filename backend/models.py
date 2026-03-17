from pydantic import BaseModel, Field
from typing import List, Optional, Literal


# ── Auth ──────────────────────────────────────────────────────────────────────

class SignupInput(BaseModel):
    username: str = Field(..., min_length=2, max_length=30)
    pin: str      = Field(..., min_length=4, max_length=20)


class LoginInput(BaseModel):
    username: str
    pin: str


class AuthResponse(BaseModel):
    token:    str
    user_id:  str
    username: str


# ── Visit Prep (Agent 1) ──────────────────────────────────────────────────────

class ConcernInput(BaseModel):
    body_area:           str
    start_time:          Optional[str] = ""
    concern_description: str
    urgency:             Literal["low", "medium", "high"]
    additional_message:  Optional[str] = ""


class ConcernMention(BaseModel):
    area:    str
    urgency: Literal["low", "medium", "high"]


class VisitPrepResponse(BaseModel):
    symptom_summary:     str
    questions_to_ask:    List[str]
    concerns_to_mention: List[ConcernMention]


# ── Doctor Note Extraction (Agent 2) ─────────────────────────────────────────

class ExtractNoteInput(BaseModel):
    text: str


class ExtractNoteResponse(BaseModel):
    diagnosis:      str
    prescriptions:  List[str]
    key_advice:     List[str]
    follow_up_date: str


# ── Concern Categorization (Agent 3) ─────────────────────────────────────────

class CategorizeInput(BaseModel):
    body_area:   str
    description: str
    urgency:     Optional[Literal["low", "medium", "high"]] = "low"


class CategorizeResponse(BaseModel):
    category:   str
    confidence: Literal["high", "medium", "low"]
    reason:     str


# ── Concern Logs ─────────────────────────────────────────────────────────────

class ConcernLog(BaseModel):
    body_area:           str
    symptom:             str
    urgency_level:       Literal["low", "medium", "high"]
    severity:            Optional[int] = Field(default=5, ge=1, le=10)
    notes:               Optional[str] = ""
    symptom_date:        Optional[str] = None
    category:            Optional[str] = "General"
    category_confidence: Optional[str] = "low"


class ConcernLogResponse(BaseModel):
    id:                  str
    date_logged:         str
    body_area:           str
    symptom:             str
    urgency_level:       str
    severity:            int
    notes:               str
    symptom_date:        Optional[str] = None
    category:            Optional[str] = "General"
    category_confidence: Optional[str] = "low"
    archived:            bool = False
    archived_at:         Optional[str] = None


class ConcernUpdateInput(BaseModel):
    symptom:             Optional[str] = None
    body_area:           Optional[str] = None
    urgency_level:       Optional[Literal["low", "medium", "high"]] = None
    severity:            Optional[int] = Field(default=None, ge=1, le=10)
    notes:               Optional[str] = None
    category:            Optional[str] = None
    category_confidence: Optional[str] = None


# ── Timeline ─────────────────────────────────────────────────────────────────

class TimelineEntryInput(BaseModel):
    visit_date:     str
    diagnosis:      str
    prescriptions:  List[str]
    key_advice:     List[str]
    follow_up_date: str


class TimelineEntryResponse(BaseModel):
    id:             str
    visit_date:     str
    diagnosis:      str
    prescriptions:  List[str]
    key_advice:     List[str]
    follow_up_date: str
    archived:       bool = False
    archived_at:    Optional[str] = None


# ── Uploads ───────────────────────────────────────────────────────────────────

class UploadResponse(BaseModel):
    id:                 str
    user_id:            str
    filename:           str
    original_name:      str
    mime_type:          str
    size_bytes:         int
    linked_timeline_id: Optional[str] = None
    uploaded_at:        str


# ── Demo Agent Chain ─────────────────────────────────────────────────────────

class AgentChainInput(BaseModel):
    body_area:     str
    symptom:       str
    urgency_level: Literal["low", "medium", "high"]
    severity:      Optional[int] = Field(default=5, ge=1, le=10)
    notes:         Optional[str] = ""
    language:      Optional[str] = "en"


class PatternResult(BaseModel):
    pattern_summary:  str
    escalation_level: Literal["monitor", "see_doctor", "urgent"]
    entry_count:      int


class VisitPrepChainResult(BaseModel):
    concern_summary:     str
    escalation_decision: Literal["monitor", "see_doctor", "urgent"]
    escalation_reason:   str
    suggested_questions: List[str]


class AgentChainResponse(BaseModel):
    step1_checkin:    ConcernLogResponse
    step2_pattern:    PatternResult
    step3_visit_prep: VisitPrepChainResult