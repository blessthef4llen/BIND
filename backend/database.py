"""
backend/database.py — SQLite-backed persistent storage for Pulse

Uses Python's built-in sqlite3. No external dependencies needed.
File: pulse_data.db (created next to this file automatically)

Tables:
  users         — hackathon-lite auth (username + hashed pin)
  concerns      — pre-visit symptom logs
  timeline      — post-visit extracted records
  uploads       — metadata for uploaded files (PDF, image)
"""

import sqlite3
import os
import uuid
import hashlib
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "pulse_data.db")
ARCHIVE_TTL_DAYS = 30


def _conn():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con


def init_db():
    """Create tables if they don't exist. Safe to call on every startup."""
    with _conn() as con:
        con.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id          TEXT PRIMARY KEY,
                username    TEXT UNIQUE NOT NULL,
                pin_hash    TEXT NOT NULL,
                created_at  TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS concerns (
                id                  TEXT PRIMARY KEY,
                user_id             TEXT NOT NULL,
                body_area           TEXT NOT NULL,
                symptom             TEXT NOT NULL,
                urgency_level       TEXT NOT NULL DEFAULT 'low',
                severity            INTEGER NOT NULL DEFAULT 5,
                notes               TEXT DEFAULT '',
                symptom_date        TEXT,
                date_logged         TEXT NOT NULL,
                category            TEXT DEFAULT 'General',
                category_confidence TEXT DEFAULT 'low',
                archived            INTEGER NOT NULL DEFAULT 0,
                archived_at         TEXT
            );

            CREATE TABLE IF NOT EXISTS timeline (
                id              TEXT PRIMARY KEY,
                user_id         TEXT NOT NULL,
                visit_date      TEXT NOT NULL,
                diagnosis       TEXT NOT NULL,
                prescriptions   TEXT NOT NULL DEFAULT '[]',
                key_advice      TEXT NOT NULL DEFAULT '[]',
                follow_up_date  TEXT NOT NULL,
                archived        INTEGER NOT NULL DEFAULT 0,
                archived_at     TEXT
            );

            CREATE TABLE IF NOT EXISTS uploads (
                id              TEXT PRIMARY KEY,
                user_id         TEXT NOT NULL,
                filename        TEXT NOT NULL,
                original_name   TEXT NOT NULL,
                mime_type       TEXT NOT NULL,
                size_bytes      INTEGER NOT NULL DEFAULT 0,
                linked_timeline_id  TEXT,
                uploaded_at     TEXT NOT NULL
            );
        """)


# ── helpers ───────────────────────────────────────────────────────────────────

def _row_to_dict(row) -> Dict[str, Any]:
    return dict(row) if row else {}


def _hash_pin(pin: str) -> str:
    return hashlib.sha256(pin.encode()).hexdigest()


import json as _json


def _parse_json_field(val, default):
    if isinstance(val, list):
        return val
    try:
        return _json.loads(val)
    except Exception:
        return default


# ── Users ─────────────────────────────────────────────────────────────────────

def create_user(username: str, pin: str) -> Optional[Dict[str, Any]]:
    uid = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    try:
        with _conn() as con:
            con.execute(
                "INSERT INTO users (id, username, pin_hash, created_at) VALUES (?,?,?,?)",
                (uid, username.strip().lower(), _hash_pin(pin), now)
            )
        return {"id": uid, "username": username.strip().lower(), "created_at": now}
    except sqlite3.IntegrityError:
        return None  # username taken


def verify_user(username: str, pin: str) -> Optional[Dict[str, Any]]:
    with _conn() as con:
        row = con.execute(
            "SELECT * FROM users WHERE username=? AND pin_hash=?",
            (username.strip().lower(), _hash_pin(pin))
        ).fetchone()
    if not row:
        return None
    d = _row_to_dict(row)
    d.pop("pin_hash", None)
    return d


def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    with _conn() as con:
        row = con.execute("SELECT id, username, created_at FROM users WHERE id=?", (user_id,)).fetchone()
    return _row_to_dict(row) if row else None


# ── Concerns ──────────────────────────────────────────────────────────────────

def add_concern(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    cid = str(uuid.uuid4())
    now = date.today().isoformat()
    with _conn() as con:
        con.execute("""
            INSERT INTO concerns
            (id,user_id,body_area,symptom,urgency_level,severity,notes,symptom_date,
             date_logged,category,category_confidence,archived,archived_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,0,NULL)
        """, (
            cid, user_id,
            data.get("body_area", ""),
            data.get("symptom", ""),
            data.get("urgency_level", "low"),
            int(data.get("severity", 5)),
            data.get("notes", ""),
            data.get("symptom_date") or now,
            now,
            data.get("category", "General"),
            data.get("category_confidence", "low"),
        ))
    return get_concern_by_id(cid)


def get_all_concerns(user_id: str, include_archived: bool = False) -> List[Dict[str, Any]]:
    q = "SELECT * FROM concerns WHERE user_id=?"
    params = [user_id]
    if not include_archived:
        q += " AND archived=0"
    q += " ORDER BY date_logged DESC, rowid DESC"
    with _conn() as con:
        rows = con.execute(q, params).fetchall()
    return [_row_to_dict(r) for r in rows]


def get_archived_concerns(user_id: str) -> List[Dict[str, Any]]:
    with _conn() as con:
        rows = con.execute(
            "SELECT * FROM concerns WHERE user_id=? AND archived=1 ORDER BY archived_at DESC",
            (user_id,)
        ).fetchall()
    return [_row_to_dict(r) for r in rows]


def get_concern_by_id(concern_id: str) -> Optional[Dict[str, Any]]:
    with _conn() as con:
        row = con.execute("SELECT * FROM concerns WHERE id=?", (concern_id,)).fetchone()
    return _row_to_dict(row) if row else None


def update_concern(concern_id: str, user_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    allowed = {"symptom", "body_area", "urgency_level", "severity", "notes", "category", "category_confidence"}
    fields = {k: v for k, v in updates.items() if k in allowed and v is not None}
    if not fields:
        return get_concern_by_id(concern_id)
    set_clause = ", ".join(f"{k}=?" for k in fields)
    vals = list(fields.values()) + [concern_id, user_id]
    with _conn() as con:
        con.execute(f"UPDATE concerns SET {set_clause} WHERE id=? AND user_id=? AND archived=0", vals)
    return get_concern_by_id(concern_id)


def archive_concern(concern_id: str, user_id: str) -> bool:
    now = datetime.utcnow().isoformat()
    with _conn() as con:
        cur = con.execute(
            "UPDATE concerns SET archived=1, archived_at=? WHERE id=? AND user_id=? AND archived=0",
            (now, concern_id, user_id)
        )
    return cur.rowcount > 0


def restore_concern(concern_id: str, user_id: str) -> bool:
    with _conn() as con:
        cur = con.execute(
            "UPDATE concerns SET archived=0, archived_at=NULL WHERE id=? AND user_id=? AND archived=1",
            (concern_id, user_id)
        )
    return cur.rowcount > 0


def delete_concern(concern_id: str, user_id: str) -> bool:
    with _conn() as con:
        cur = con.execute("DELETE FROM concerns WHERE id=? AND user_id=?", (concern_id, user_id))
    return cur.rowcount > 0


def purge_expired_concerns(user_id: str) -> int:
    cutoff = (datetime.utcnow() - timedelta(days=ARCHIVE_TTL_DAYS)).isoformat()
    with _conn() as con:
        cur = con.execute(
            "DELETE FROM concerns WHERE user_id=? AND archived=1 AND archived_at<?",
            (user_id, cutoff)
        )
    return cur.rowcount


# ── Timeline ──────────────────────────────────────────────────────────────────

def add_timeline_entry(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    tid = str(uuid.uuid4())
    with _conn() as con:
        con.execute("""
            INSERT INTO timeline
            (id,user_id,visit_date,diagnosis,prescriptions,key_advice,follow_up_date,archived,archived_at)
            VALUES (?,?,?,?,?,?,?,0,NULL)
        """, (
            tid, user_id,
            data.get("visit_date", date.today().isoformat()),
            data.get("diagnosis", ""),
            _json.dumps(data.get("prescriptions", [])),
            _json.dumps(data.get("key_advice", [])),
            data.get("follow_up_date", ""),
        ))
    return get_timeline_entry_by_id(tid)


def get_all_timeline(user_id: str, include_archived: bool = False) -> List[Dict[str, Any]]:
    q = "SELECT * FROM timeline WHERE user_id=?"
    if not include_archived:
        q += " AND archived=0"
    q += " ORDER BY visit_date DESC"
    with _conn() as con:
        rows = con.execute(q, [user_id]).fetchall()
    result = []
    for r in rows:
        d = _row_to_dict(r)
        d["prescriptions"] = _parse_json_field(d.get("prescriptions"), [])
        d["key_advice"]     = _parse_json_field(d.get("key_advice"), [])
        result.append(d)
    return result


def get_timeline_entry_by_id(entry_id: str) -> Optional[Dict[str, Any]]:
    with _conn() as con:
        row = con.execute("SELECT * FROM timeline WHERE id=?", (entry_id,)).fetchone()
    if not row:
        return None
    d = _row_to_dict(row)
    d["prescriptions"] = _parse_json_field(d.get("prescriptions"), [])
    d["key_advice"]     = _parse_json_field(d.get("key_advice"), [])
    return d


def archive_timeline_entry(entry_id: str, user_id: str) -> bool:
    now = datetime.utcnow().isoformat()
    with _conn() as con:
        cur = con.execute(
            "UPDATE timeline SET archived=1, archived_at=? WHERE id=? AND user_id=? AND archived=0",
            (now, entry_id, user_id)
        )
    return cur.rowcount > 0


def restore_timeline_entry(entry_id: str, user_id: str) -> bool:
    with _conn() as con:
        cur = con.execute(
            "UPDATE timeline SET archived=0, archived_at=NULL WHERE id=? AND user_id=? AND archived=1",
            (entry_id, user_id)
        )
    return cur.rowcount > 0


# ── Uploads ───────────────────────────────────────────────────────────────────

UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)


def save_upload_meta(user_id: str, filename: str, original_name: str,
                     mime_type: str, size_bytes: int,
                     linked_timeline_id: Optional[str] = None) -> Dict[str, Any]:
    uid = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    with _conn() as con:
        con.execute("""
            INSERT INTO uploads
            (id,user_id,filename,original_name,mime_type,size_bytes,linked_timeline_id,uploaded_at)
            VALUES (?,?,?,?,?,?,?,?)
        """, (uid, user_id, filename, original_name, mime_type, size_bytes, linked_timeline_id, now))
    return {"id": uid, "user_id": user_id, "filename": filename,
            "original_name": original_name, "mime_type": mime_type,
            "size_bytes": size_bytes, "linked_timeline_id": linked_timeline_id,
            "uploaded_at": now}


def get_uploads_for_user(user_id: str) -> List[Dict[str, Any]]:
    with _conn() as con:
        rows = con.execute(
            "SELECT * FROM uploads WHERE user_id=? ORDER BY uploaded_at DESC", (user_id,)
        ).fetchall()
    return [_row_to_dict(r) for r in rows]


def get_uploads_for_timeline(user_id: str, timeline_id: str) -> List[Dict[str, Any]]:
    with _conn() as con:
        rows = con.execute(
            "SELECT * FROM uploads WHERE user_id=? AND linked_timeline_id=?",
            (user_id, timeline_id)
        ).fetchall()
    return [_row_to_dict(r) for r in rows]