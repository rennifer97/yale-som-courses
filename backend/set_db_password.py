"""Put your Supabase password into ../.env without showing it on screen.

Run from backend/:  python set_db_password.py
"""

from getpass import getpass
from pathlib import Path
from urllib.parse import quote

ENV = Path(__file__).resolve().parent.parent / ".env"

lines = ENV.read_text(encoding="utf-8").splitlines()
idx = next((i for i, l in enumerate(lines) if l.startswith("DATABASE_URL=")), None)
if idx is None or "[YOUR-PASSWORD]" not in lines[idx]:
    raise SystemExit("No [YOUR-PASSWORD] placeholder found in .env. It may already be filled in.")

password = getpass("Paste your Supabase database password (nothing will show), then press Return: ").strip()
if not password:
    raise SystemExit("Nothing entered. Run it again.")

# quote() keeps symbols like @ or / from breaking the address.
lines[idx] = lines[idx].replace("[YOUR-PASSWORD]", quote(password, safe=""))
ENV.write_text("\n".join(lines) + "\n", encoding="utf-8")
print("Saved. Your password is in .env (which git ignores).")
