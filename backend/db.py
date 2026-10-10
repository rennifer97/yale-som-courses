"""Database access: courses, users, chats.

Locally this uses data/yale_som.db (SQLite). Online, set DATABASE_URL to the
Supabase Postgres connection string and the same code talks to Supabase.
"""

from __future__ import annotations

import json
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
load_dotenv(ROOT / ".env")
load_dotenv(ROOT.parent / ".env")

SQLITE_PATH = ROOT / "data" / "yale_som.db"


def _url() -> str:
    url = os.getenv("DATABASE_URL", "").strip()
    if not url:
        return f"sqlite:///{SQLITE_PATH}"
    # Supabase hands out postgres:// or postgresql:// — tell SQLAlchemy to use psycopg 3.
    for prefix in ("postgres://", "postgresql://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix):]
    return url


engine: Engine = create_engine(_url(), pool_pre_ping=True)
IS_SQLITE = engine.dialect.name == "sqlite"
ID_COL = "INTEGER PRIMARY KEY AUTOINCREMENT" if IS_SQLITE else "SERIAL PRIMARY KEY"

COURSE_COLUMNS = [
    "id", "course_id", "course_number", "course_title", "course_category", "course_type",
    "course_session", "course_description", "faculty_1", "faculty_1_email", "faculty_bio",
    "daytimes", "room", "section", "units", "syllabus", "old_syllabus",
]


def init_db() -> None:
    """Add the users and chats tables next to the existing courses table."""
    with engine.begin() as conn:
        conn.execute(text(f"""
            CREATE TABLE IF NOT EXISTS users (
                id {ID_COL},
                email TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )"""))
        conn.execute(text(f"""
            CREATE TABLE IF NOT EXISTS chats (
                id {ID_COL},
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                role TEXT NOT NULL,
                text TEXT NOT NULL,
                tools_used TEXT NOT NULL DEFAULT '[]',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )"""))
        conn.execute(text("CREATE INDEX IF NOT EXISTS chats_user_idx ON chats (user_id, id)"))


# ---------- courses ----------

_SELECT = "SELECT " + ", ".join(COURSE_COLUMNS) + " FROM courses"
_SEARCH_TEXT = " || ' ' || ".join(
    f"COALESCE({c}, '')"
    for c in ["course_number", "course_title", "faculty_1", "course_category", "course_type",
              "course_session", "daytimes", "room", "course_description", "faculty_bio"]
)


def all_courses() -> list[dict]:
    with engine.connect() as conn:
        return [dict(r._mapping) for r in conn.execute(text(_SELECT + " ORDER BY course_number, section"))]


def search_courses(query: str = "", category: str = "", faculty: str = "", day: str = "") -> list[dict]:
    """Every word in `query` must appear in the course (spaces ignored, so MGT409 finds MGT 409)."""
    where, params = [], {}
    for i, word in enumerate(query.lower().split()):
        params[f"w{i}"] = f"%{word}%"
        params[f"s{i}"] = f"%{word.replace(' ', '')}%"
        where.append(f"(LOWER({_SEARCH_TEXT}) LIKE :w{i} OR LOWER(REPLACE(course_number, ' ', '')) LIKE :s{i})")
    for col, val in (("course_category", category), ("faculty_1", faculty), ("daytimes", day)):
        if val:
            params[col] = f"%{val.lower()}%"
            where.append(f"LOWER(COALESCE({col}, '')) LIKE :{col}")
    sql = _SELECT + (" WHERE " + " AND ".join(where) if where else "") + " ORDER BY course_number, section"
    with engine.connect() as conn:
        return [dict(r._mapping) for r in conn.execute(text(sql), params)]


# ---------- users ----------

def create_user(email: str, name: str, password_hash: str) -> dict:
    with engine.begin() as conn:
        conn.execute(
            text("INSERT INTO users (email, name, password_hash) VALUES (:e, :n, :h)"),
            {"e": email, "n": name, "h": password_hash},
        )
    return get_user_by_email(email)  # type: ignore[return-value]


def get_user_by_email(email: str) -> dict | None:
    with engine.connect() as conn:
        row = conn.execute(text("SELECT id, email, name, password_hash FROM users WHERE email = :e"), {"e": email}).first()
    return dict(row._mapping) if row else None


def get_user(user_id: int) -> dict | None:
    with engine.connect() as conn:
        row = conn.execute(text("SELECT id, email, name FROM users WHERE id = :i"), {"i": user_id}).first()
    return dict(row._mapping) if row else None


# ---------- chats ----------

def add_chat(user_id: int, role: str, body: str, tools_used: list[str] | None = None) -> None:
    with engine.begin() as conn:
        conn.execute(
            text("INSERT INTO chats (user_id, role, text, tools_used) VALUES (:u, :r, :t, :tools)"),
            {"u": user_id, "r": role, "t": body, "tools": json.dumps(tools_used or [])},
        )


def get_chats(user_id: int, limit: int | None = None) -> list[dict]:
    """Oldest first. With `limit`, only the most recent N messages."""
    sql = "SELECT id, role, text, tools_used FROM chats WHERE user_id = :u ORDER BY id DESC"
    params: dict = {"u": user_id}
    if limit:
        sql += " LIMIT :n"
        params["n"] = limit
    with engine.connect() as conn:
        rows = [dict(r._mapping) for r in conn.execute(text(sql), params)]
    for r in rows:
        r["tools_used"] = json.loads(r["tools_used"] or "[]")
    return list(reversed(rows))


def clear_chats(user_id: int) -> None:
    with engine.begin() as conn:
        conn.execute(text("DELETE FROM chats WHERE user_id = :u"), {"u": user_id})
