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


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY not set")
        _client = AsyncOpenAI(api_key=api_key)
    return _client


def _build_prompt(req: SuggestRequest) -> str:
    return _PROMPT_TEMPLATE.format(
        ingredients=", ".join(req.ingredients),
        diet=req.constraints.diet or "any",
        time_minutes=req.constraints.time_minutes or 30,
        equipment=", ".join(req.constraints.equipment) if req.constraints.equipment else "any",
        spice_level=req.constraints.spice_level or "medium",
    )


def _extract_json(text: str) -> dict:
    """Try to extract JSON from the model response, handling markdown fences."""
    text = text.strip()
    # Strip markdown code fences if present
    if text.startswith("```"):
        # Remove first line (```json or ```) and last line (```)
        lines = text.split("\n")
        lines = lines[1:]  # drop opening fence
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines)
    return json.loads(text)


async def generate_suggestion(req: SuggestRequest) -> SuggestResponse:
    """Call OpenAI and return a validated SuggestResponse."""
    client = _get_client()
    prompt = _build_prompt(req)

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a practical cooking assistant. Respond only with valid JSON."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        max_tokens=1500,
    )

    raw = response.choices[0].message.content or ""
    logger.info("OpenAI raw response length: %d chars", len(raw))

    try:
        data = _extract_json(raw)
        return SuggestResponse.model_validate(data)
    except (json.JSONDecodeError, ValidationError) as exc:
        logger.warning("Failed to parse OpenAI response: %s\nRaw: %s", exc, raw[:500])
        # Fallback: try once more with a stricter prompt
        retry = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a JSON-only assistant. Fix the following invalid JSON so it matches the required schema. Return ONLY valid JSON, nothing else."},
                {"role": "user", "content": raw},
            ],
            temperature=0.0,
            max_tokens=1500,
        )
        retry_raw = retry.choices[0].message.content or ""
        data = _extract_json(retry_raw)
        return SuggestResponse.model_validate(data)
