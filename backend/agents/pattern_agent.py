"""
agents/pattern_agent.py — Pattern detection across concern history

Analyses prior concern entries for escalation patterns.
Returns escalation_level: monitor | see_doctor | urgent
"""

from typing import Any, Dict, List


def detect_pattern(prior_concerns: List[Dict[str, Any]],
                   new_concern: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyse prior entries for the same body area and determine if there's escalation.

    Returns:
        pattern_summary:  str
        escalation_level: 'monitor' | 'see_doctor' | 'urgent'
        entry_count:      int
    """
    total = len(prior_concerns) + 1  # +1 for new entry

    # Urgency weight
    urgency_weight = {"high": 3, "medium": 2, "low": 1}
    new_urgency    = new_concern.get("urgency_level", "low")
    new_severity   = int(new_concern.get("severity", 5))

    # Hard urgent triggers
    urgent_keywords = [
        "chest pain", "can't breathe", "cannot breathe", "difficulty breathing",
        "severe", "unbearable", "emergency", "fainting", "unconscious",
    ]
    symptom_lower = new_concern.get("symptom", "").lower()
    if any(k in symptom_lower for k in urgent_keywords) or new_urgency == "high" and new_severity >= 9:
        return {
            "pattern_summary":  "Urgent symptom detected. Seek immediate care.",
            "escalation_level": "urgent",
            "entry_count":      total,
        }

    # Escalation over time
    high_count   = sum(1 for c in prior_concerns if c.get("urgency_level") == "high")
    medium_count = sum(1 for c in prior_concerns if c.get("urgency_level") == "medium")
    avg_severity = (sum(int(c.get("severity", 5)) for c in prior_concerns) / len(prior_concerns)) if prior_concerns else 5

    if new_urgency == "high" and high_count >= 2:
        level   = "urgent"
        summary = (f"This is your {total}th logged concern in this area. "
                   f"Repeated high-urgency entries suggest escalation — consider seeing a doctor soon.")
    elif (new_urgency in ("high", "medium") and total >= 3) or (avg_severity >= 7 and new_severity >= 7):
        level   = "see_doctor"
        summary = (f"You've logged {total} concerns in this area. "
                   f"The pattern suggests this needs medical attention.")
    elif total >= 2:
        level   = "monitor"
        summary = (f"You've logged {total} concerns in this area. "
                   f"Keep monitoring. If it worsens, book an appointment.")
    else:
        level   = "monitor"
        summary = "First entry for this area. Keep monitoring and log any changes."

    return {"pattern_summary": summary, "escalation_level": level, "entry_count": total}