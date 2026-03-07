"""OpenAI service for generating meal suggestions."""

import json
import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from openai import AsyncOpenAI
from pydantic import ValidationError

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "packages"))

from shared.schemas import SuggestRequest, SuggestResponse

load_dotenv()
logger = logging.getLogger("spice.openai")

_PROMPT_PATH = Path(__file__).parent / "prompts" / "suggest.md"
_PROMPT_TEMPLATE = _PROMPT_PATH.read_text(encoding="utf-8")

_client: AsyncOpenAI | None = None
_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY not set")
        _client = AsyncOpenAI(api_key=api_key, timeout=45.0, max_retries=1)
    return _client


_FEEDBACK_GUIDANCE = {
    "too_salty": "User found previous result too salty. Use less seasoning, add salt late, increase water ratio.",
    "too_bland": "User found previous result too bland. Bloom spices harder, concentrate broth, suggest umami if available.",
    "needs_spice": "User wants more heat. Suggest chilli bloom, pepper, hot sauce (only if available).",
    "perfect": "Previous result was perfect. Maintain similar approach.",
}


def _build_prompt(req: SuggestRequest) -> str:
    feedback_lines = []
    for fb in req.feedback_history:
        if fb in _FEEDBACK_GUIDANCE:
            feedback_lines.append(_FEEDBACK_GUIDANCE[fb])

    return _PROMPT_TEMPLATE.format(
        ingredients=", ".join(req.ingredients),
        pantry_items=", ".join(req.pantry_items) if req.pantry_items else "none",
        diet=req.constraints.diet or "any",
        time_minutes=req.constraints.time_minutes or 30,
        equipment=", ".join(req.constraints.equipment) if req.constraints.equipment else "any",
        spice_level=req.constraints.spice_level or "medium",
        flavour_mode=req.constraints.flavour_mode or "umami",
        skill_mode=req.constraints.skill_mode or "beginner",
        feedback="; ".join(feedback_lines) if feedback_lines else "none",
    )


def _extract_json(text: str) -> dict:
    """Extract JSON from model response, handling markdown fences."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines)
    return json.loads(text)


async def generate_suggestion(req: SuggestRequest) -> SuggestResponse:
    """Call OpenAI and return a validated SuggestResponse."""
    client = _get_client()
    prompt = _build_prompt(req)

    response = await client.chat.completions.create(
        model=_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are SPICE, a practical cooking assistant. "
                    "Respond with ONLY valid JSON. No markdown. No explanation."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        max_tokens=2000,
    )

    raw = response.choices[0].message.content or ""
    logger.info("OpenAI raw response length: %d chars", len(raw))

    try:
        data = _extract_json(raw)
        # If the LLM flagged a rejection, return a minimal valid response
        if data.get("rejection"):
            return SuggestResponse(rejection=data["rejection"])
        return SuggestResponse.model_validate(data)
    except (json.JSONDecodeError, ValidationError) as exc:
        logger.warning("Failed to parse OpenAI response: %s\nRaw: %s", exc, raw[:500])
        # Retry with stricter prompt
        try:
            retry = await client.chat.completions.create(
                model=_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "Fix the following into valid JSON matching the SPICE schema. Return ONLY valid JSON.",
                    },
                    {"role": "user", "content": raw},
                ],
                temperature=0.0,
                max_tokens=2000,
            )
            retry_raw = retry.choices[0].message.content or ""
            data = _extract_json(retry_raw)
            return SuggestResponse.model_validate(data)
        except Exception as retry_exc:
            logger.error("Retry also failed: %s", retry_exc)
            raise
