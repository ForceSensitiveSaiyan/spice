"""Tests for the /v1/suggest endpoint."""

import json
import sys
import os

import pytest

# Ensure shared schemas are importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "packages"))

from fastapi.testclient import TestClient
from shared.schemas import SuggestResponse

from spice.main import app

client = TestClient(app)


# ── Validation tests ──────────────────────────────────────────────

def test_empty_ingredients_returns_422():
    """Submitting no ingredients should fail validation."""
    res = client.post("/v1/suggest", json={"ingredients": []})
    assert res.status_code == 422


def test_missing_body_returns_422():
    """Submitting no body at all should fail validation."""
    res = client.post("/v1/suggest", content=b"not json", headers={"Content-Type": "application/json"})
    assert res.status_code == 422


# ── Mock response tests ──────────────────────────────────────────

def test_suggest_returns_valid_response():
    """A valid request should return a response matching the schema."""
    res = client.post("/v1/suggest", json={
        "ingredients": ["maggi noodles", "onion"],
        "constraints": {"diet": "vegetarian", "time_minutes": 15},
    })
    assert res.status_code == 200
    data = res.json()

    # Validate against Pydantic model
    parsed = SuggestResponse.model_validate(data)
    assert parsed.title
    assert parsed.prep_time_minutes > 0
    assert len(parsed.steps) > 0


def test_suggest_steps_are_time_ordered():
    """Steps should be in non-decreasing time order."""
    res = client.post("/v1/suggest", json={
        "ingredients": ["rice", "egg", "soy sauce", "garlic"],
    })
    assert res.status_code == 200
    steps = res.json()["steps"]
    times = [s["t"] for s in steps]
    assert times == sorted(times)


def test_suggest_upgrades_require_missing_ingredient():
    """Each upgrade should require an ingredient not in the request."""
    ingredients = ["maggi noodles", "onion"]
    res = client.post("/v1/suggest", json={"ingredients": ingredients})
    assert res.status_code == 200
    for upgrade in res.json().get("upgrades", []):
        assert upgrade["requires"] not in ingredients, (
            f"Upgrade requires '{upgrade['requires']}' which the user already has"
        )


def test_suggest_default_fallback():
    """Unknown ingredients should still return a valid response."""
    res = client.post("/v1/suggest", json={"ingredients": ["mystery paste"]})
    assert res.status_code == 200
    SuggestResponse.model_validate(res.json())


# ── JSON parsing robustness ──────────────────────────────────────

def test_json_extract_strips_markdown_fences():
    """The _extract_json helper should handle markdown-wrapped JSON."""
    from spice.openai_service import _extract_json

    raw = '```json\n{"title": "test"}\n```'
    assert _extract_json(raw) == {"title": "test"}


def test_json_extract_plain():
    """The _extract_json helper should handle plain JSON."""
    from spice.openai_service import _extract_json

    raw = '{"title": "test", "steps": []}'
    assert _extract_json(raw) == {"title": "test", "steps": []}
