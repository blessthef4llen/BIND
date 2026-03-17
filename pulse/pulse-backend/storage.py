from datetime import datetime, timedelta

# ─────────────────────────────────────────────
#  In-memory stores  (resets on restart — fine for demo)
# ─────────────────────────────────────────────

_concerns = []
_timeline = []

# ─────────────────────────────────────────────
#  Seed 8 days of escalating ankle data
# ─────────────────────────────────────────────

def _seed():
    base = datetime.now() - timedelta(days=7)
    entries = [
        ("Left Ankle", "Mild ache after morning run",              3, "low"),
        ("Left Ankle", "Soreness when going up stairs",            4, "low"),
        ("Left Ankle", "Persistent ache, noticeable limping",      5, "medium"),
        ("Left Ankle", "Sharp pain when putting weight on it",     6, "medium"),
        ("Left Ankle", "Swelling visible, hard to walk",           7, "high"),
        ("Left Ankle", "Pain radiating to arch and heel",          8, "high"),
        ("Left Ankle", "Cannot walk normally, severe arch pain",   8, "high"),
    ]
    for i, (area, symptom, severity, urgency) in enumerate(entries):
        _concerns.append({
            "body_area":     area,
            "symptom":       symptom,
            "severity":      severity,
            "urgency_level": urgency,
            "notes":         f"Day {i + 1}",
            "date_logged":   (base + timedelta(days=i)).strftime("%Y-%m-%d"),
            "language":      "en",
        })

_seed()

# ─────────────────────────────────────────────
#  Concern helpers
# ─────────────────────────────────────────────

def get_all_concerns():
    return list(_concerns)

def add_concern(data: dict):
    data.setdefault("date_logged", datetime.now().strftime("%Y-%m-%d"))
    data.setdefault("language", "en")
    _concerns.append(data)
    return data

# ─────────────────────────────────────────────
#  Timeline helpers
# ─────────────────────────────────────────────

def get_timeline():
    return list(_timeline)

def add_timeline_entry(data: dict):
    data.setdefault("visit_date", datetime.now().strftime("%Y-%m-%d"))
    _timeline.append(data)
    return data
