# ─────────────────────────────────────────────
#  pattern_agent.py
#
#  TO PLUG IN IBM GRANITE:
#    Same setup as prep_agent.py.
#    Replace the stub return with a _call_granite() call.
# ─────────────────────────────────────────────


def detect_pattern(concerns: list) -> dict:
    """
    Analyse a list of concern dicts and return an escalation assessment.

    Stub computes severity trend from actual data so the demo numbers are real.
    Replace body with Granite call when ready.
    """

    if not concerns:
        return {
            "escalation_level": "monitor",
            "pattern_summary":  "No concerns logged yet.",
            "recurring_areas":  [],
            "severity_trend":   "stable",
        }

    severities = [c.get("severity", 0) for c in concerns]
    areas      = [c.get("body_area", "") for c in concerns]
    max_sev    = max(severities)
    min_sev    = min(severities)
    trend      = "escalating" if severities[-1] > severities[0] else "stable"

    # Simple escalation logic — Granite would do this smarter
    if max_sev >= 7 or (trend == "escalating" and len(concerns) >= 3):
        level = "urgent" if max_sev >= 9 else "see_doctor"
    else:
        level = "monitor"

    # Most recurring area
    from collections import Counter
    top_area = Counter(areas).most_common(1)[0][0] if areas else "unknown"

    return {
        "escalation_level": level,
        "pattern_summary": (
            f"Severity has trended from {min_sev}/10 to {max_sev}/10 over "
            f"{len(concerns)} logged entries. Primary area: {top_area}. "
            f"Trend is {trend}. Prompt evaluation is recommended."
        ),
        "recurring_areas": list(set(areas)),
        "severity_trend":  trend,
    }
