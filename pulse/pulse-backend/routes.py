from flask import request, jsonify
import storage
from agents.prep_agent    import generate_visit_prep
from agents.pattern_agent import detect_pattern
from agents.extractor_agent import extract_doctor_note


def register_routes(app):

    # ── Health check ──────────────────────────────────────────────────────────
    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "granite_ready": False, "ibm_ready": False})

    # ── Concerns ─────────────────────────────────────────────────────────────
    @app.get("/api/concerns")
    def get_concerns():
        concerns = storage.get_all_concerns()
        return jsonify({"concerns": concerns, "total": len(concerns)})

    @app.post("/api/log-concern")
    def log_concern():
        data = request.get_json(force=True) or {}
        required = ["body_area", "symptom", "urgency_level", "severity"]
        missing  = [f for f in required if f not in data]
        if missing:
            return jsonify({"error": f"Missing fields: {missing}"}), 400

        saved = storage.add_concern(data)
        return jsonify({
            "status":         "saved",
            "concern":        saved,
            "total_concerns": len(storage.get_all_concerns()),
        })

    # ── Timeline ─────────────────────────────────────────────────────────────
    @app.get("/api/timeline")
    def get_timeline():
        return jsonify({"timeline": storage.get_timeline()})

    @app.post("/api/save-visit")
    def save_visit():
        data  = request.get_json(force=True) or {}
        entry = storage.add_timeline_entry(data)
        return jsonify({"status": "saved", "entry": entry,
                        "total_entries": len(storage.get_timeline())})

    # ── Visit prep (standalone) ───────────────────────────────────────────────
    @app.post("/api/prep")
    def visit_prep():
        concerns = storage.get_all_concerns()
        pattern  = detect_pattern(concerns)
        prep     = generate_visit_prep(concerns, pattern)
        return jsonify({**prep, "escalation": pattern})

    # ── Doctor note extraction ────────────────────────────────────────────────
    @app.post("/api/extract")
    def extract_notes():
        data = request.get_json(force=True) or {}
        text = data.get("raw_text") or data.get("text", "")
        if not text:
            return jsonify({"error": "raw_text is required"}), 400
        result = extract_doctor_note(text)
        return jsonify(result)

    # ── Agent chain (the 3-step demo) ─────────────────────────────────────────
    @app.post("/api/run-agent-chain")
    def run_agent_chain():
        data = request.get_json(force=True) or {}

        # Step 1 — log the incoming entry
        required = ["body_area", "symptom", "urgency_level", "severity"]
        if all(f in data for f in required):
            storage.add_concern(data)
        all_concerns = storage.get_all_concerns()

        # Step 2 — pattern detection
        pattern = detect_pattern(all_concerns)

        # Step 3 — visit prep
        prep = generate_visit_prep(all_concerns, pattern)

        return jsonify({
            "chain_complete":  True,
            "step1_logged":    True,
            "step2_pattern":   pattern,
            "step3_visit_prep": {
                **prep,
                "escalation_decision": pattern["escalation_level"],
                "escalation_level":    pattern["escalation_level"],
            },
        })
