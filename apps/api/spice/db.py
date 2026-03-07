"""SQLite persistence for anonymous combo tracking and community feedback."""

import hashlib
import os
import sqlite3
import threading

_DB_PATH = os.environ.get("DB_PATH", os.path.join(os.path.dirname(__file__), "data", "spice.db"))
_conn: sqlite3.Connection | None = None
_lock = threading.Lock()


def init_db() -> None:
    """Create tables (idempotent) and enable WAL mode."""
    global _conn
    if _DB_PATH != ":memory:":
        os.makedirs(os.path.dirname(_DB_PATH), exist_ok=True)
    _conn = sqlite3.connect(_DB_PATH, check_same_thread=False)
    _conn.execute("PRAGMA foreign_keys=ON")
    _conn.execute("PRAGMA journal_mode=WAL")
    _conn.executescript("""
        CREATE TABLE IF NOT EXISTS combos (
            combo_hash   TEXT PRIMARY KEY,
            combo_sig    TEXT NOT NULL,
            hit_count    INTEGER NOT NULL DEFAULT 0,
            created_at   TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_combos_hit_count ON combos(hit_count DESC);

        CREATE TABLE IF NOT EXISTS feedback (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            combo_hash    TEXT NOT NULL REFERENCES combos(combo_hash),
            feedback_type TEXT NOT NULL CHECK(feedback_type IN ('too_salty','too_bland','perfect','needs_spice')),
            created_at    TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_feedback_combo ON feedback(combo_hash);
    """)
    _conn.commit()


def close_db() -> None:
    """Close the database connection."""
    global _conn
    if _conn is not None:
        _conn.close()
        _conn = None


def _get_conn() -> sqlite3.Connection:
    if _conn is None:
        raise RuntimeError("Database not initialised — call init_db() first")
    return _conn


def make_combo_hash(ingredients: list[str], flavour_mode: str | None) -> tuple[str, str]:
    """Return (combo_sig, combo_hash). Matches frontend makeSignature exactly."""
    sig = ",".join(sorted(ingredients)) + "|" + (flavour_mode or "none")
    h = hashlib.sha256(sig.encode()).hexdigest()
    return sig, h


def record_combo(combo_sig: str, combo_hash: str) -> int:
    """Upsert combo and return the new hit_count."""
    conn = _get_conn()
    with _lock:
        conn.execute(
            """INSERT INTO combos (combo_hash, combo_sig, hit_count)
               VALUES (?, ?, 1)
               ON CONFLICT(combo_hash) DO UPDATE
               SET hit_count = hit_count + 1, updated_at = datetime('now')""",
            (combo_hash, combo_sig),
        )
        conn.commit()
    row = conn.execute("SELECT hit_count FROM combos WHERE combo_hash = ?", (combo_hash,)).fetchone()
    return row[0] if row else 0


def combo_exists(combo_hash: str) -> bool:
    conn = _get_conn()
    row = conn.execute("SELECT 1 FROM combos WHERE combo_hash = ?", (combo_hash,)).fetchone()
    return row is not None


def record_feedback(combo_hash: str, feedback_type: str) -> None:
    conn = _get_conn()
    with _lock:
        conn.execute(
            "INSERT INTO feedback (combo_hash, feedback_type) VALUES (?, ?)",
            (combo_hash, feedback_type),
        )
        conn.commit()


def get_feedback_breakdown(combo_hash: str) -> tuple[dict[str, int], int]:
    """Return (percentage_dict, total_count) for a combo's feedback."""
    conn = _get_conn()
    rows = conn.execute(
        "SELECT feedback_type, COUNT(*) FROM feedback WHERE combo_hash = ? GROUP BY feedback_type",
        (combo_hash,),
    ).fetchall()
    total = sum(r[1] for r in rows)
    if total == 0:
        return {}, 0
    breakdown = {r[0]: round(r[1] / total * 100) for r in rows}
    return breakdown, total
