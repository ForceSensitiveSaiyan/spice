"""Tests for the db module."""

from spice.db import (
    make_combo_hash,
    record_combo,
    combo_exists,
    record_feedback,
    get_feedback_breakdown,
)


def test_make_combo_hash_is_deterministic():
    sig1, h1 = make_combo_hash(["b", "a"], "umami")
    sig2, h2 = make_combo_hash(["a", "b"], "umami")
    assert sig1 == sig2
    assert h1 == h2


def test_make_combo_hash_sorts_ingredients():
    sig, _ = make_combo_hash(["onion", "garlic", "egg"], None)
    assert sig == "egg,garlic,onion|none"


def test_make_combo_hash_includes_flavour_mode():
    _, h1 = make_combo_hash(["rice"], "umami")
    _, h2 = make_combo_hash(["rice"], "bold_spicy")
    assert h1 != h2


def test_make_combo_hash_none_flavour():
    sig, _ = make_combo_hash(["rice"], None)
    assert sig.endswith("|none")


def test_record_combo_returns_count():
    _, h = make_combo_hash(["db_test_x", "db_test_y"], "test_mode")
    count1 = record_combo("db_test_x,db_test_y|test_mode", h)
    assert count1 >= 1
    count2 = record_combo("db_test_x,db_test_y|test_mode", h)
    assert count2 == count1 + 1


def test_combo_exists_after_record():
    _, h = make_combo_hash(["exists_a", "exists_b"], None)
    assert combo_exists(h) is False
    record_combo("exists_a,exists_b|none", h)
    assert combo_exists(h) is True


def test_feedback_breakdown_empty():
    _, h = make_combo_hash(["no_feedback_a"], None)
    record_combo("no_feedback_a|none", h)
    breakdown, total = get_feedback_breakdown(h)
    assert total == 0
    assert breakdown == {}


def test_feedback_breakdown_percentages():
    _, h = make_combo_hash(["fb_pct_a", "fb_pct_b"], None)
    record_combo("fb_pct_a,fb_pct_b|none", h)

    record_feedback(h, "perfect")
    record_feedback(h, "perfect")
    record_feedback(h, "perfect")
    record_feedback(h, "too_bland")

    breakdown, total = get_feedback_breakdown(h)
    assert total == 4
    assert breakdown["perfect"] == 75
    assert breakdown["too_bland"] == 25


def test_record_feedback_for_nonexistent_combo():
    """Feedback for a combo that doesn't exist should still insert (FK not enforced in SQLite by default)."""
    import hashlib
    h = hashlib.sha256(b"nonexistent").hexdigest()
    # Should not raise
    record_feedback(h, "perfect")
