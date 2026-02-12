"""Tests for the /v1/suggest endpoint – premium schema."""

import json
import sys
import os

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "packages"))

from fastapi.testclient import TestClient
from shared.schemas import SuggestResponse, UpgradeLadder

from spice.main import app

client = TestClient(app)


# ── Validation tests ──────────────────────────────────────────────

def test_empty_ingredients_returns_422():
    res = client.post("/v1/suggest", json={"ingredients": []})
    assert res.status_code == 422


def test_missing_body_returns_422():
    res = client.post("/v1/suggest", content=b"not json", headers={"Content-Type": "application/json"})
    assert res.status_code == 422


# ── Schema compliance ─────────────────────────────────────────────

def test_response_matches_new_schema():
    """Response should include upgrade_ladder, why_this_works, t_seconds steps."""
    res = client.post("/v1/suggest", json={
        "ingredients": ["maggi noodles", "onion"],
        "constraints": {"flavour_mode": "umami", "skill_mode": "beginner"},
    })
    assert res.status_code == 200
    data = res.json()
    parsed = SuggestResponse.model_validate(data)

    assert parsed.title
    assert parsed.prep_time_minutes > 0
    assert len(parsed.steps) > 0
    assert all(isinstance(s.t_seconds, int) for s in parsed.steps)
    assert len(parsed.why_this_works) >= 2
    assert isinstance(parsed.upgrade_ladder, UpgradeLadder)


def test_steps_use_t_seconds_and_are_ordered():
    res = client.post("/v1/suggest", json={
        "ingredients": ["rice", "egg", "soy sauce", "garlic"],
    })
    assert res.status_code == 200
    steps = res.json()["steps"]
    times = [s["t_seconds"] for s in steps]
    assert times == sorted(times)
    assert all(isinstance(t, int) for t in times)


def test_steps_have_optional_tips():
    """At least one step in the Maggi mock should have a tip."""
    res = client.post("/v1/suggest", json={
        "ingredients": ["maggi noodles", "onion"],
    })
    tips = [s.get("tip") for s in res.json()["steps"] if s.get("tip")]
    assert len(tips) >= 1


# ── Upgrade ladder gating ─────────────────────────────────────────

def test_upgrade_ladder_structure():
    """Response should have tiered upgrade ladder."""
    res = client.post("/v1/suggest", json={"ingredients": ["maggi noodles", "onion"]})
    ladder = res.json()["upgrade_ladder"]
    assert "pantry_upgrade" in ladder
    assert "if_you_have" in ladder
    assert "one_pound_shop" in ladder


def test_upgrades_require_missing_ingredients():
    """No upgrade should require an ingredient the user already has."""
    ingredients = ["maggi noodles", "onion"]
    res = client.post("/v1/suggest", json={"ingredients": ingredients})
    ladder = res.json()["upgrade_ladder"]

    all_upgrades = ladder["pantry_upgrade"] + ladder["if_you_have"]
    if ladder["one_pound_shop"]:
        all_upgrades.append(ladder["one_pound_shop"])

    for upgrade in all_upgrades:
        assert upgrade["requires"] not in ingredients, (
            f"Upgrade requires '{upgrade['requires']}' which the user already has"
        )


# ── Minimal rescue ────────────────────────────────────────────────

def test_single_ingredient_triggers_rescue():
    """A single ingredient should trigger minimal_rescue."""
    res = client.post("/v1/suggest", json={"ingredients": ["maggi noodles"]})
    assert res.status_code == 200
    data = res.json()
    parsed = SuggestResponse.model_validate(data)

    assert parsed.minimal_rescue is not None
    assert parsed.minimal_rescue.enabled is True
    assert len(parsed.minimal_rescue.flavour_hacks) >= 1
    assert len(parsed.minimal_rescue.ask_for) >= 1
    assert parsed.minimal_rescue.rescue_line == "You're 2 steps away from elite noodles."


# ── Flavour mode + new request fields ────────────────────────────

def test_request_accepts_new_fields():
    """Request should accept flavour_mode, skill_mode, pantry_items, feedback_history."""
    res = client.post("/v1/suggest", json={
        "ingredients": ["maggi noodles", "onion"],
        "constraints": {
            "flavour_mode": "bold_spicy",
            "skill_mode": "confident",
        },
        "pantry_items": ["oil", "salt"],
        "feedback_history": ["too_bland"],
    })
    assert res.status_code == 200
    SuggestResponse.model_validate(res.json())


def test_default_fallback_still_works():
    """Unknown ingredients should still return valid response."""
    res = client.post("/v1/suggest", json={"ingredients": ["mystery paste", "other thing"]})
    assert res.status_code == 200
    SuggestResponse.model_validate(res.json())


# ── JSON parsing robustness ──────────────────────────────────────

def test_json_extract_strips_markdown_fences():
    from spice.openai_service import _extract_json
    raw = '```json\n{"title": "test"}\n```'
    assert _extract_json(raw) == {"title": "test"}


def test_json_extract_plain():
    from spice.openai_service import _extract_json
    raw = '{"title": "test", "steps": []}'
    assert _extract_json(raw) == {"title": "test", "steps": []}


# ── Feedback guidance ─────────────────────────────────────────────

def test_feedback_guidance_mapping():
    from spice.openai_service import _FEEDBACK_GUIDANCE
    assert "too_salty" in _FEEDBACK_GUIDANCE
    assert "too_bland" in _FEEDBACK_GUIDANCE
    assert "needs_spice" in _FEEDBACK_GUIDANCE
    assert "perfect" in _FEEDBACK_GUIDANCE
