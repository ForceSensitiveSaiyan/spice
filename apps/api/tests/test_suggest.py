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


# ── Calorie estimates ────────────────────────────────────────────

def test_response_includes_calories_estimate():
    """Mock responses should include calorie estimates."""
    res = client.post("/v1/suggest", json={"ingredients": ["maggi noodles", "onion"]})
    assert res.status_code == 200
    data = res.json()
    assert "calories_estimate" in data
    assert isinstance(data["calories_estimate"], int)
    assert data["calories_estimate"] > 0


def test_schema_validates_with_calories():
    """SuggestResponse should accept calories_estimate field."""
    res = client.post("/v1/suggest", json={"ingredients": ["rice", "egg", "soy sauce", "garlic"]})
    assert res.status_code == 200
    parsed = SuggestResponse.model_validate(res.json())
    assert parsed.calories_estimate is not None
    assert parsed.calories_estimate > 0


# ── Rejection field ─────────────────────────────────────────────

def test_schema_accepts_rejection_field():
    """SuggestResponse should accept a rejection-only response."""
    data = {
        "rejection": "Headphones are better listened to than saut\u00e9ed.",
        "title": "",
        "prep_time_minutes": 0,
        "steps": [],
        "why_this_works": [],
        "upgrade_ladder": {"pantry_upgrade": [], "if_you_have": [], "one_pound_shop": None},
        "pantry_used": [],
        "notes": [],
        "safety": {"assumptions": [], "missing_ingredients": [], "disclaimer": ""},
    }
    parsed = SuggestResponse.model_validate(data)
    assert parsed.rejection is not None
    assert parsed.title == ""


def test_existing_responses_have_no_rejection():
    """Normal mock responses should have rejection=None."""
    res = client.post("/v1/suggest", json={"ingredients": ["maggi noodles", "onion"]})
    assert res.status_code == 200
    data = res.json()
    assert data.get("rejection") is None


# ── Health endpoint ──────────────────────────────────────────────

def test_health_returns_ok():
    """GET /health should return 200 with status field."""
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "version" in data


# ── CORS headers ─────────────────────────────────────────────────

def test_cors_headers_present():
    """OPTIONS preflight should return CORS headers for allowed origin."""
    res = client.options(
        "/v1/suggest",
        headers={
            "Origin": "http://localhost:3737",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert res.headers.get("access-control-allow-origin") == "http://localhost:3737"


# ── Edge cases ───────────────────────────────────────────────────

def test_oversized_ingredients_list():
    """100+ ingredients should still return a valid response (no crash)."""
    ingredients = [f"item_{i}" for i in range(100)]
    res = client.post("/v1/suggest", json={"ingredients": ingredients})
    assert res.status_code == 200
    SuggestResponse.model_validate(res.json())


def test_special_characters_in_ingredients():
    """Input with special characters should not cause errors."""
    res = client.post("/v1/suggest", json={
        "ingredients": ["<script>alert(1)</script>", "onion & garlic"],
    })
    assert res.status_code == 200
    data = res.json()
    SuggestResponse.model_validate(data)


# ── Community tracking ────────────────────────────────────────────

def test_suggest_returns_community_stats():
    """Suggest response should include community stats."""
    res = client.post("/v1/suggest", json={"ingredients": ["maggi noodles", "onion"]})
    assert res.status_code == 200
    data = res.json()
    assert "community" in data
    assert data["community"]["combo_count"] >= 1
    assert isinstance(data["community"]["feedback_breakdown"], dict)
    assert isinstance(data["community"]["total_feedback"], int)


def test_combo_count_increments():
    """Same ingredient combo should increment combo_count."""
    ingredients = ["unique_test_a", "unique_test_b"]
    res1 = client.post("/v1/suggest", json={"ingredients": ingredients})
    count1 = res1.json()["community"]["combo_count"]
    res2 = client.post("/v1/suggest", json={"ingredients": ingredients})
    count2 = res2.json()["community"]["combo_count"]
    assert count2 == count1 + 1


def test_feedback_endpoint_returns_breakdown():
    """POST /v1/feedback should accept feedback and return breakdown."""
    # First generate a combo so it exists
    client.post("/v1/suggest", json={"ingredients": ["feedback_item_a", "feedback_item_b"]})
    sig = ",".join(sorted(["feedback_item_a", "feedback_item_b"])) + "|none"
    res = client.post("/v1/feedback", json={
        "combo_signature": sig,
        "feedback_type": "perfect",
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["total_feedback"] >= 1
    assert "perfect" in data["feedback_breakdown"]


def test_feedback_unknown_combo_returns_404():
    """Feedback for a combo that was never searched should return 404."""
    res = client.post("/v1/feedback", json={
        "combo_signature": "never_searched_x,never_searched_y|none",
        "feedback_type": "perfect",
    })
    assert res.status_code == 404


# ── Rate limiting ────────────────────────────────────────────────

def test_rate_limit_returns_429():
    """Exceeding rate limit should return 429."""
    import spice.rate_limit as rl
    from spice.rate_limit import _store, _lock

    # Temporarily set a very low limit
    original_max = rl._MAX_REQUESTS
    rl._MAX_REQUESTS = 2

    # Clear state for the test IP
    with _lock:
        _store.pop("testclient", None)

    try:
        client.post("/v1/suggest", json={"ingredients": ["rice", "egg"]})
        client.post("/v1/suggest", json={"ingredients": ["rice", "egg"]})
        res = client.post("/v1/suggest", json={"ingredients": ["rice", "egg"]})
        assert res.status_code == 429
    finally:
        rl._MAX_REQUESTS = original_max
        with _lock:
            _store.pop("testclient", None)


# ── Concurrent requests ──────────────────────────────────────────

def test_concurrent_requests():
    """Multiple parallel requests should all succeed."""
    import concurrent.futures

    def make_request():
        return client.post("/v1/suggest", json={"ingredients": ["rice", "egg"]})

    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        futures = [pool.submit(make_request) for _ in range(5)]
        results = [f.result() for f in futures]

    assert all(r.status_code == 200 for r in results)
