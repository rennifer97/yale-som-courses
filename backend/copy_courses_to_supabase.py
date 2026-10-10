"""One-time copy of the courses table from data/yale_som.db into Supabase.

Run from backend/ after putting DATABASE_URL (the Supabase connection string) in .env:
    python copy_courses_to_supabase.py
Safe to re-run: it empties the Supabase courses table first, then copies all rows.
"""

from __future__ import annotations

import sqlite3

from sqlalchemy import text

import db

COLUMNS = [
    "course_id", "course_number", "course_title", "course_category", "course_type", "course_session",
    "course_description", "faculty_1", "faculty_1_email", "faculty_bio", "daytimes", "timings_day",
    "timings_start", "timings_end", "room", "section", "units", "term_code", "syllabus", "old_syllabus",
]


def main() -> None:
    if db.IS_SQLITE:
        raise SystemExit("DATABASE_URL isn't set, so there's nowhere to copy to. Add the Supabase string to .env.")

    src = sqlite3.connect(db.SQLITE_PATH)
    src.row_factory = sqlite3.Row
    rows = [dict(r) for r in src.execute("SELECT " + ", ".join(COLUMNS) + " FROM courses")]

    with db.engine.begin() as conn:
        conn.execute(text(
            "CREATE TABLE IF NOT EXISTS courses (id SERIAL PRIMARY KEY, "
            + ", ".join(f"{c} TEXT" for c in COLUMNS) + ")"
        ))
        conn.execute(text("DELETE FROM courses"))
        conn.execute(
            text("INSERT INTO courses (" + ", ".join(COLUMNS) + ") VALUES (" + ", ".join(f":{c}" for c in COLUMNS) + ")"),
            rows,
        )
    db.init_db()  # users + chats tables

    with db.engine.connect() as conn:
        count = conn.execute(text("SELECT COUNT(*) FROM courses")).scalar()
    print(f"Copied {len(rows)} courses. Supabase now has {count}. Users and chats tables are ready.")


if __name__ == "__main__":
    main()
