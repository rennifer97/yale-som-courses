"""Yale SOM course assistant: one PydanticAI agent with two tools."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any

from pydantic_ai import Agent, RunContext
from pydantic_ai.messages import ModelMessage, ModelRequest, ModelResponse, TextPart, ThinkingPart, UserPromptPart
from pydantic_ai.usage import UsageLimits

import tools
from models import AgentResult, SearchResult

HERE = Path(__file__).resolve().parent
AUDIT_PATH = HERE.parent / "output" / "audit_trail.json"
SYSTEM_PROMPT = (HERE / "prompts" / "prompt.md").read_text(encoding="utf-8")
MAX_REQUESTS = 8  # model calls per question, so a confused agent can't loop forever
MAX_HISTORY = 12  # earlier chat turns sent back to the model (6 questions + 6 answers)


@dataclass
class ChatDeps:
    tool_calls: list[dict[str, Any]] = field(default_factory=list)


agent = Agent(
    tools.make_model(),
    deps_type=ChatDeps,
    instructions=SYSTEM_PROMPT,
)


@agent.tool
def search_courses(
    ctx: RunContext[ChatDeps], query: str = "", category: str = "", faculty: str = "", day: str = ""
) -> SearchResult:
    """Search the Fall 2026 Yale SOM course list by keywords (title, number, faculty, description),
    with optional category / faculty / day filters. Returns total_matches and up to 15 rows."""
    result = tools.search_courses(query, category, faculty, day)
    ctx.deps.tool_calls.append({
        "tool": "search_courses",
        "args": {"query": query, "category": category, "faculty": faculty, "day": day},
        "result": f"{result.total_matches} matches: "
                  + ", ".join(f"{c.number} {c.title}" for c in result.courses[:5]),
    })
    return result


@agent.tool
async def web_search(ctx: RunContext[ChatDeps], query: str) -> str:
    """Search the public web. Use only when the course list can't answer."""
    text = await tools.web_search(query)
    ctx.deps.tool_calls.append({"tool": "web_search", "args": {"query": query}, "result": text[:300]})
    return text


def _thoughts(messages) -> list[str]:
    """Any text or reasoning the model wrote before calling tools."""
    out = []
    for m in messages:
        if isinstance(m, ModelResponse) and m.tool_calls:
            for p in m.parts:
                if isinstance(p, (TextPart, ThinkingPart)) and p.content.strip():
                    out.append(p.content.strip()[:500])
    return out


def _history(turns: list[dict]) -> list[ModelMessage]:
    """Turn the chat so far into PydanticAI messages so the agent remembers it."""
    out: list[ModelMessage] = []
    for t in turns[-MAX_HISTORY:]:
        text = (t.get("text") or "").strip()
        if not text:
            continue
        if t.get("role") == "user":
            out.append(ModelRequest(parts=[UserPromptPart(content=text)]))
        else:
            out.append(ModelResponse(parts=[TextPart(content=text)]))
    return out


def _audit(entry: dict) -> None:
    """Append one run to output/audit_trail.json without wiping earlier rows."""
    AUDIT_PATH.parent.mkdir(parents=True, exist_ok=True)
    try:
        rows = json.loads(AUDIT_PATH.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        rows = []
    rows.append(entry)
    AUDIT_PATH.write_text(json.dumps(rows, indent=2, ensure_ascii=False), encoding="utf-8")


def run_agent(message: str, history: list[dict] | None = None) -> dict:
    """Answer one chat message, remembering earlier turns. Called by main.py's /api/chat."""
    deps = ChatDeps()
    past = _history(history or [])
    entry: dict[str, Any] = {
        "time": datetime.now().isoformat(timespec="seconds"),
        "user_message": message,
        "history_turns": len(past),
    }
    try:
        result = agent.run_sync(
            message, deps=deps, message_history=past, usage_limits=UsageLimits(request_limit=MAX_REQUESTS)
        )
        reply = result.output
        entry["thoughts"] = _thoughts(result.new_messages())
        entry["stop_reason"] = "answered"
    except Exception as exc:
        reply = f"Sorry, I couldn't finish that one ({type(exc).__name__}). Try asking again."
        entry["stop_reason"] = f"error: {type(exc).__name__}: {exc}"[:500]
    entry["tool_calls"] = deps.tool_calls
    entry["reply"] = reply
    _audit(entry)

    tools_used = list(dict.fromkeys(c["tool"] for c in deps.tool_calls))
    return AgentResult(reply=reply, tools_used=tools_used).model_dump()


if __name__ == "__main__":
    print(run_agent("Who teaches MGT 409?"))
