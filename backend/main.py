"""Yale SOM course explorer API desk (Lecture 8: database, logins, saved chats).

Run from backend/:  uvicorn main:app --reload --port 8000
Open API docs:      http://127.0.0.1:8000/docs
Frontend (Vite):    http://127.0.0.1:5173
"""

from __future__ import annotations

import os
import re

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import auth
import db
from agent import MAX_HISTORY, run_agent

app = FastAPI(title="Yale SOM Courses", version="0.2.0")

# Locally Vite runs on 5173. Online, set FRONTEND_URL to the Render static site URL.
origins = ["http://127.0.0.1:5173", "http://localhost:5173"]
if os.getenv("FRONTEND_URL"):
    origins.append(os.getenv("FRONTEND_URL", "").rstrip("/"))
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    db.init_db()


EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class SignUp(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: str
    password: str = Field(min_length=8, max_length=72)  # bcrypt only reads the first 72 bytes


class SignIn(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    token: str
    user: dict


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)


class ChatResponse(BaseModel):
    reply: str
    tools_used: list[str] = Field(default_factory=list)


@app.get("/api/health")
def health():
    return {"ok": True, "database": db.engine.dialect.name}


# ---------- accounts ----------

@app.post("/api/signup", response_model=AuthResponse)
def signup(body: SignUp):
    email = body.email.strip().lower()
    if not EMAIL_RE.match(email):
        raise HTTPException(400, "Please enter a valid email.")
    if db.get_user_by_email(email):
        raise HTTPException(409, "That email already has an account. Try signing in.")
    user = db.create_user(email, body.name.strip(), auth.hash_password(body.password))
    return AuthResponse(token=auth.make_token(user["id"]), user={"name": user["name"], "email": user["email"]})


@app.post("/api/login", response_model=AuthResponse)
def login(body: SignIn):
    user = db.get_user_by_email(body.email.strip().lower())
    if not user or not auth.check_password(body.password, user["password_hash"]):
        raise HTTPException(401, "Wrong email or password.")
    return AuthResponse(token=auth.make_token(user["id"]), user={"name": user["name"], "email": user["email"]})


@app.get("/api/me")
def me(user: dict = Depends(auth.current_user)):
    return {"name": user["name"], "email": user["email"]}


# ---------- courses ----------

@app.get("/api/courses")
def list_courses(q: str | None = Query(default=None), user: dict = Depends(auth.current_user)):
    """Return courses for the React catalog (optional text filter)."""
    courses = db.search_courses(q) if q else db.all_courses()
    return {"count": len(courses), "courses": courses}


# ---------- chat ----------

@app.get("/api/chats")
def chat_history(user: dict = Depends(auth.current_user)):
    return {"messages": db.get_chats(user["id"])}


@app.delete("/api/chats")
def chat_clear(user: dict = Depends(auth.current_user)):
    db.clear_chats(user["id"])
    return {"ok": True}


@app.post("/api/chat", response_model=ChatResponse)
def chat(body: ChatRequest, user: dict = Depends(auth.current_user)):
    # Memory comes from the saved chats, so it survives refreshes and new devices.
    past = db.get_chats(user["id"], limit=MAX_HISTORY)
    history = [{"role": m["role"], "text": m["text"]} for m in past]
    result = run_agent(body.message, history)
    reply = result.get("reply", "")
    tools_used = list(result.get("tools_used") or [])
    db.add_chat(user["id"], "user", body.message)
    db.add_chat(user["id"], "assistant", reply, tools_used)
    return ChatResponse(reply=reply, tools_used=tools_used)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)
