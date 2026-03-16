def generate_visit_prep(data):
    symptom = data.get("symptom", "unknown symptom")

    return {
        "symptom_summary": f"User reports {symptom}",
        "questions_to_ask": [
            "What could be causing this?",
            "Should I be concerned?",
            "What treatments should I consider?"
        ],
        "concerns_to_mention": [symptom]
    }