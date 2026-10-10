"""The agent's two tools: search_courses (courses table) and web_search (public web)."""

from __future__ import annotations

import os

from openai import AsyncOpenAI
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider

import db  # also loads .env (Lecture 8 Class Work/ or MGT409/)
from models import Course, CourseHit, SearchResult

MODEL_NAME = os.getenv("OPENAI_MODEL", "gpt-5.6-luna")
os.environ.setdefault("PYDANTIC_AI_NO_BANNER", "1")

MAX_RESULTS = 15
DESC_CHARS = 400
BIO_CHARS = 300


def _client() -> AsyncOpenAI:
    """Portkey client. The key comes from .env and is never printed."""
    key = os.getenv("PORTKEY_API_KEY")
    if not key:
        raise RuntimeError("PORTKEY_API_KEY is missing from the .env file.")
    return AsyncOpenAI(
        api_key=key,
        base_url="https://api.portkey.ai/v1",
        default_headers={"x-portkey-api-key": key},
    )


def make_model() -> OpenAIChatModel:
    return OpenAIChatModel(MODEL_NAME, provider=OpenAIProvider(openai_client=_client()))


def _clip(text: str, n: int) -> str:
    text = " ".join(text.split())
    return text if len(text) <= n else text[: n - 1] + "…"


def search_courses(query: str = "", category: str = "", faculty: str = "", day: str = "") -> SearchResult:
    """Keyword search over the courses table. Every word in `query` must match.

    `category`, `faculty`, `day` are extra filters (substring match).
    """
    rows = [Course.model_validate(r) for r in db.search_courses(query, category, faculty, day)]
    shown = [
        CourseHit(
            **c.model_dump(exclude={"description", "faculty_bio"}),
            description=_clip(c.description, DESC_CHARS),
            faculty_bio=_clip(c.faculty_bio, BIO_CHARS),
        )
        for c in rows[:MAX_RESULTS]
    ]
    return SearchResult(total_matches=len(rows), shown=len(shown), courses=shown)


async def web_search(query: str) -> str:
    """Ask the model with OpenAI's built-in web search (same trick as Lecture 3)."""
    response = await _client().responses.create(
        model=MODEL_NAME,
        tools=[{"type": "web_search_preview"}],
        input=f"Search the web and answer briefly with source names and links: {query}",
    )
    return response.output_text
