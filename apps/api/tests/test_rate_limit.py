"""Tests for the rate limiter module."""

import time

from spice.rate_limit import check_rate_limit, get_limit_info, _store, _lock, _MAX_REQUESTS


def _reset_store():
    """Clear rate limit state between tests."""
    with _lock:
        _store.clear()


def test_allows_requests_under_limit():
    _reset_store()
    ip = "test_under_limit"
    for _ in range(_MAX_REQUESTS):
        assert check_rate_limit(ip) is True


def test_blocks_at_limit():
    _reset_store()
    ip = "test_at_limit"
    for _ in range(_MAX_REQUESTS):
        check_rate_limit(ip)
    assert check_rate_limit(ip) is False


def test_different_ips_have_separate_limits():
    _reset_store()
    for _ in range(_MAX_REQUESTS):
        check_rate_limit("ip_a")
    # ip_a is exhausted, ip_b should still work
    assert check_rate_limit("ip_a") is False
    assert check_rate_limit("ip_b") is True


def test_expired_entries_are_pruned(monkeypatch):
    _reset_store()
    ip = "test_prune"
    # Fill up the limit
    for _ in range(_MAX_REQUESTS):
        check_rate_limit(ip)
    assert check_rate_limit(ip) is False

    # Advance time past the window
    import spice.rate_limit as rl
    original_window = rl._WINDOW_SECONDS
    monkeypatch.setattr(rl, "_WINDOW_SECONDS", 0)  # all entries expire immediately
    assert check_rate_limit(ip) is True
    monkeypatch.setattr(rl, "_WINDOW_SECONDS", original_window)


def test_get_limit_info_returns_config():
    info = get_limit_info()
    assert "max_requests" in info
    assert "window_seconds" in info
    assert isinstance(info["max_requests"], int)
    assert isinstance(info["window_seconds"], int)


def test_cleanup_removes_stale_ips(monkeypatch):
    _reset_store()
    import spice.rate_limit as rl

    # Add an entry for a stale IP
    with _lock:
        _store["stale_ip"] = [0.0]  # timestamp in the past

    # Force cleanup to run by setting last_cleanup far in the past
    monkeypatch.setattr(rl, "_last_cleanup", 0.0)
    monkeypatch.setattr(rl, "_CLEANUP_INTERVAL", 0)

    # Trigger cleanup via a normal request
    check_rate_limit("fresh_ip")

    with _lock:
        assert "stale_ip" not in _store
        assert "fresh_ip" in _store
