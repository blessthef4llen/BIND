"""
storage.py — In-memory storage for Pulse backend.

In production, swap the dicts for SQLite or IBM Cloudant.
All IDs are UUIDs. Archive = soft delete with 30-day TTL.

Stores:
  - concerns:  pre-visit symptom logs (with archive state)
  - timeline:  post-visit extracted records (with archive state)
"""

import uuid
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional

# ── In-memory stores ──────────────────────────────────────────────────────────
_concerns: List[Dict[str, Any]] = []
_timeline: List[Dict[str, Any]] = []

ARCHIVE_TTL_DAYS = 30


# ─────────────────────────────────────────────────────────────────────────────
#  Concerns
# ─────────────────────────────────────────────────────────────────────────────

def get_all_concerns(include_archived: bool = False) -> List[Dict[str, Any]]:
    """Returns concerns, most-recent first. Excludes archived by default."""
    results = _concerns if include_archived else [c for c in _concerns if not c.get("archived")]
    return list(reversed(results))


def get_archived_concerns() -> List[Dict[str, Any]]:
    """Returns only archived concerns, most-recently archived first."""
    archived = [c for c in _concerns if c.get("archived")]
    return sorted(archived, key=lambda x: x.get("archived_at", ""), reverse=True)


def add_concern(concern: Dict[str, Any]) -> Dict[str, Any]:
    entry = {
        "id":          str(uuid.uuid4()),
        "date_logged": date.today().isoformat(),
        "archived":    False,
        "archived_at": None,
        **concern,
    }
    _concerns.append(entry)
    return entry


def update_concern(concern_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    for c in _concerns:
        if c.get("id") == concern_id and not c.get("archived"):
            # Only allow updating mutable fields
            allowed = {"symptom", "body_area", "urgency_level", "severity", "notes", "category", "category_confidence"}
            for key in allowed:
                if key in updates:
                    c[key] = updates[key]
            return c
    return None


def archive_concern(concern_id: str) -> bool:
    for c in _concerns:
        if c.get("id") == concern_id and not c.get("archived"):
            c["archived"]    = True
            c["archived_at"] = datetime.utcnow().isoformat()
            return True
    return False


def restore_concern(concern_id: str) -> bool:
    for c in _concerns:
        if c.get("id") == concern_id and c.get("archived"):
            c["archived"]    = False
            c["archived_at"] = None
            return True
    return False


def delete_concern(concern_id: str) -> bool:
    """Hard delete — only call for permanent purge or explicit user action."""
    global _concerns
    before = len(_concerns)
    _concerns = [c for c in _concerns if c.get("id") != concern_id]
    return len(_concerns) < before


def get_concern_by_id(concern_id: str) -> Optional[Dict[str, Any]]:
    for c in _concerns:
        if c.get("id") == concern_id:
            return c
    return None


def purge_expired_archives() -> int:
    """Hard-delete archived items older than ARCHIVE_TTL_DAYS. Returns count purged."""
    global _concerns
    cutoff = (datetime.utcnow() - timedelta(days=ARCHIVE_TTL_DAYS)).isoformat()
    before = len(_concerns)
    _concerns = [
        c for c in _concerns
        if not (c.get("archived") and c.get("archived_at", "") < cutoff)
    ]
    return before - len(_concerns)


# ─────────────────────────────────────────────────────────────────────────────
#  Timeline (post-visit records)
# ─────────────────────────────────────────────────────────────────────────────

def get_all_timeline(include_archived: bool = False) -> List[Dict[str, Any]]:
    results = _timeline if include_archived else [t for t in _timeline if not t.get("archived")]
    return sorted(results, key=lambda x: x.get("visit_date", ""), reverse=True)


def add_timeline_entry(entry: Dict[str, Any]) -> Dict[str, Any]:
    record = {
        "id":          str(uuid.uuid4()),
        "archived":    False,
        "archived_at": None,
        **entry,
    }
    _timeline.append(record)
    return record


def archive_timeline_entry(entry_id: str) -> bool:
    for t in _timeline:
        if t.get("id") == entry_id and not t.get("archived"):
            t["archived"]    = True
            t["archived_at"] = datetime.utcnow().isoformat()
            return True
    return False


def restore_timeline_entry(entry_id: str) -> bool:
    for t in _timeline:
        if t.get("id") == entry_id and t.get("archived"):
            t["archived"]    = False
            t["archived_at"] = None
            return True
    return False