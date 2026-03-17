"""
backend/pdf_report.py — AI-generated post-visit PDF report

Generates a clean, patient-friendly PDF from extracted visit data.
Uses reportlab (pure Python, no external binaries needed).

Install: pip install reportlab
"""

import os
import io
from datetime import date
from typing import Any, Dict, List, Optional

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.colors import HexColor, black, white
    from reportlab.lib.units import inch
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, HRFlowable,
        Table, TableStyle, KeepTogether,
    )
    from reportlab.lib.enums import TA_LEFT, TA_CENTER
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


REPORTS_DIR = os.path.join(os.path.dirname(__file__), "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)

# Brand colors
RED       = HexColor("#C94040")
CHARCOAL  = HexColor("#1C1C1E")
OFFWHITE  = HexColor("#FAF9F7")
LIGHT_RED = HexColor("#F7ECEC")
BORDER    = HexColor("#EAE4E4")
MUTED     = HexColor("#6C6060")


def _build_styles():
    base = getSampleStyleSheet()

    return {
        "title": ParagraphStyle(
            "title", parent=base["Normal"],
            fontSize=28, fontName="Helvetica-Bold",
            textColor=CHARCOAL, spaceAfter=4, leading=32,
        ),
        "subtitle": ParagraphStyle(
            "subtitle", parent=base["Normal"],
            fontSize=11, fontName="Helvetica",
            textColor=MUTED, spaceAfter=16,
        ),
        "section_head": ParagraphStyle(
            "section_head", parent=base["Normal"],
            fontSize=8, fontName="Helvetica-Bold",
            textColor=MUTED, spaceBefore=16, spaceAfter=6,
            letterSpacing=1.2, textTransform="uppercase",
        ),
        "body": ParagraphStyle(
            "body", parent=base["Normal"],
            fontSize=11, fontName="Helvetica",
            textColor=CHARCOAL, leading=17, spaceAfter=4,
        ),
        "bullet": ParagraphStyle(
            "bullet", parent=base["Normal"],
            fontSize=11, fontName="Helvetica",
            textColor=CHARCOAL, leading=17,
            leftIndent=14, spaceAfter=3,
        ),
        "disclaimer": ParagraphStyle(
            "disclaimer", parent=base["Normal"],
            fontSize=9, fontName="Helvetica-Oblique",
            textColor=MUTED, leading=14,
        ),
        "diagnosis": ParagraphStyle(
            "diagnosis", parent=base["Normal"],
            fontSize=16, fontName="Helvetica-Bold",
            textColor=CHARCOAL, spaceAfter=4,
        ),
    }


def generate_report_pdf(
    user_name: str,
    visit_date: str,
    diagnosis: str,
    prescriptions: List[str],
    key_advice: List[str],
    follow_up_date: str,
    filename_prefix: str = "report",
) -> Optional[str]:
    """
    Generate a PDF report and save to REPORTS_DIR.
    Returns the file path on success, None if reportlab is unavailable.
    """
    if not REPORTLAB_AVAILABLE:
        print("pdf_report: reportlab not installed, skipping PDF generation")
        return None

    import uuid as _uuid
    filename = f"{filename_prefix}_{_uuid.uuid4().hex[:8]}.pdf"
    filepath = os.path.join(REPORTS_DIR, filename)

    doc = SimpleDocTemplate(
        filepath,
        pagesize=letter,
        leftMargin=0.8 * inch,
        rightMargin=0.8 * inch,
        topMargin=0.8 * inch,
        bottomMargin=0.8 * inch,
    )

    styles = _build_styles()
    story  = []

    # ── Header ────────────────────────────────────────────────────────────────
    story.append(Paragraph("PULSE", styles["title"]))
    story.append(Paragraph(
        f"Post-Visit Health Summary  ·  {visit_date}  ·  {user_name}",
        styles["subtitle"]
    ))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER, spaceAfter=12))

    # ── Disclaimer ────────────────────────────────────────────────────────────
    story.append(Paragraph(
        "⚠  This is an AI-generated organizational summary. It is not a medical diagnosis. "
        "Always refer to your original doctor's notes and follow your provider's advice.",
        styles["disclaimer"]
    ))
    story.append(Spacer(1, 16))

    # ── Diagnosis ─────────────────────────────────────────────────────────────
    story.append(Paragraph("DIAGNOSIS", styles["section_head"]))
    story.append(Paragraph(diagnosis, styles["diagnosis"]))
    story.append(Spacer(1, 8))

    # ── Prescriptions ─────────────────────────────────────────────────────────
    if prescriptions:
        story.append(Paragraph(
            "PRESCRIPTIONS" if len(prescriptions) > 1 else "PRESCRIPTION",
            styles["section_head"]
        ))
        for rx in prescriptions:
            story.append(Paragraph(f"• Rx: {rx}", styles["bullet"]))
        story.append(Spacer(1, 8))

    # ── Doctor's Advice ───────────────────────────────────────────────────────
    if key_advice:
        story.append(Paragraph("DOCTOR'S ADVICE", styles["section_head"]))
        for tip in key_advice:
            story.append(Paragraph(f"→  {tip}", styles["bullet"]))
        story.append(Spacer(1, 8))

    # ── Follow-up ─────────────────────────────────────────────────────────────
    story.append(Paragraph("FOLLOW-UP", styles["section_head"]))
    story.append(Paragraph(follow_up_date, styles["body"]))
    story.append(Spacer(1, 24))

    # ── Footer ────────────────────────────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER, spaceAfter=8))
    story.append(Paragraph(
        f"Generated by PULSE · Powered by IBM Granite · {date.today().isoformat()}",
        styles["disclaimer"]
    ))

    doc.build(story)
    return filepath


def generate_report_bytes(
    user_name: str,
    visit_date: str,
    diagnosis: str,
    prescriptions: List[str],
    key_advice: List[str],
    follow_up_date: str,
) -> Optional[bytes]:
    """
    Like generate_report_pdf but returns bytes directly (for streaming to client).
    """
    if not REPORTLAB_AVAILABLE:
        return None

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=letter,
        leftMargin=0.8 * inch, rightMargin=0.8 * inch,
        topMargin=0.8 * inch, bottomMargin=0.8 * inch,
    )

    styles = _build_styles()
    story  = []

    story.append(Paragraph("PULSE", styles["title"]))
    story.append(Paragraph(
        f"Post-Visit Health Summary  ·  {visit_date}  ·  {user_name}",
        styles["subtitle"]
    ))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER, spaceAfter=12))
    story.append(Paragraph(
        "⚠  AI-generated organizational summary. Not a medical diagnosis. Always follow your provider's advice.",
        styles["disclaimer"]
    ))
    story.append(Spacer(1, 16))
    story.append(Paragraph("DIAGNOSIS", styles["section_head"]))
    story.append(Paragraph(diagnosis, styles["diagnosis"]))
    story.append(Spacer(1, 8))

    if prescriptions:
        story.append(Paragraph("PRESCRIPTIONS", styles["section_head"]))
        for rx in prescriptions:
            story.append(Paragraph(f"• Rx: {rx}", styles["bullet"]))
        story.append(Spacer(1, 8))

    if key_advice:
        story.append(Paragraph("DOCTOR'S ADVICE", styles["section_head"]))
        for tip in key_advice:
            story.append(Paragraph(f"→  {tip}", styles["bullet"]))
        story.append(Spacer(1, 8))

    story.append(Paragraph("FOLLOW-UP", styles["section_head"]))
    story.append(Paragraph(follow_up_date, styles["body"]))
    story.append(Spacer(1, 24))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER, spaceAfter=8))
    story.append(Paragraph(
        f"Generated by PULSE · Powered by IBM Granite · {date.today().isoformat()}",
        styles["disclaimer"]
    ))

    doc.build(story)
    return buffer.getvalue()