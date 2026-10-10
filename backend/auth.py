"""Passwords (bcrypt) and sign-in tokens."""

from __future__ import annotations

import os
import secrets

import bcrypt
from fastapi import Header, HTTPException
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

import db

# SECRET_KEY signs the sign-in tokens. Set it in .env / Render. Without one, a random
# key is made at startup (fine locally, but everyone gets signed out on restart).
_signer = URLSafeTimedSerializer(os.getenv("SECRET_KEY") or secrets.token_urlsafe(32), salt="som-login")
TOKEN_DAYS = 7


def hash_password(password: str) -> str:
    # bcrypt makes a fresh random salt and stores it inside the hash string.
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def check_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def make_token(user_id: int) -> str:
    return _signer.dumps({"uid": user_id})


def current_user(authorization: str = Header(default="")) -> dict:
    """FastAPI dependency: reads 'Authorization: Bearer <token>' and returns the user."""
    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(401, "Please sign in.")
    try:
        data = _signer.loads(token, max_age=TOKEN_DAYS * 86400)
    except SignatureExpired:
        raise HTTPException(401, "Your session expired. Please sign in again.")
    except BadSignature:
        raise HTTPException(401, "Please sign in.")
    user = db.get_user(int(data["uid"]))
    if not user:
        raise HTTPException(401, "Please sign in.")
    return user
