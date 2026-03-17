# ─────────────────────────────────────────────
#  extractor_agent.py
#
#  TO PLUG IN IBM GRANITE:
#    Same setup as prep_agent.py.
#    Replace the stub return with a _call_granite() call.
# ─────────────────────────────────────────────


def extract_doctor_note(text: str) -> dict:
    """
    Parse raw doctor-note text and return structured fields.

    Stub does basic keyword extraction so it responds to the actual
    text pasted — feels real without Granite.
    Replace body with Granite call when ready.
    """

    text_lower = text.lower() if text else ""

    # ── Simple keyword heuristics ─────────────────────────────────────────────
    diagnosis = "Undetermined — see doctor for full evaluation"
    if "plantar fasciitis" in text_lower:
        diagnosis = "Plantar Fasciitis — Flat Feet"
    elif "sprain" in text_lower:
        diagnosis = "Ankle Sprain"
    elif "fracture" in text_lower:
        diagnosis = "Stress Fracture"
    elif "tendon" in text_lower or "tendinitis" in text_lower:
        diagnosis = "Tendinitis"
    elif "ligament" in text_lower or "mcl" in text_lower or "acl" in text_lower:
        diagnosis = "Ligament Strain"

    prescriptions = []
    for drug in ["ibuprofen", "naproxen", "acetaminophen", "tylenol", "advil"]:
        if drug in text_lower:
            prescriptions.append({
                "name": drug.title() + " (as noted in record)",
                "instructions": "As directed by physician — follow prescribed dosage"
            })
    if not prescriptions:
        prescriptions = [{"name": "See attached prescription", "instructions": "As directed"}]

    advice = []
    if "rest" in text_lower or "rice" in text_lower:
        advice.append("RICE protocol (Rest, Ice, Compression, Elevation)")
    if "avoid" in text_lower:
        advice.append("Avoid high-impact activity as advised")
    if "orthotics" in text_lower or "referral" in text_lower:
        advice.append("Orthotics referral recommended")
    if "physical therapy" in text_lower or "pt" in text_lower:
        advice.append("Physical therapy recommended")
    if not advice:
        advice = ["Follow all physician instructions", "Monitor symptoms and report changes"]

    follow_up = "As directed by physician"
    for marker in ["follow up", "follow-up", "return in", "weeks", "months"]:
        if marker in text_lower:
            idx = text_lower.find(marker)
            snippet = text[idx:idx+40].strip().split("\n")[0]
            follow_up = snippet
            break

    return {
        "diagnosis":    diagnosis,
        "prescriptions": prescriptions,
        "key_advice":   advice,
        "follow_up":    follow_up,
    }
