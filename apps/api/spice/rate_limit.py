"""Simple in-memory per-IP rate limiter for the suggest endpoint."""

import os
import time
import threading

# Configurable via env: max requests per window per IP
_MAX_REQUESTS = int(os.environ.get("RATE_LIMIT_MAX", "20"))
_WINDOW_SECONDS = int(os.environ.get("RATE_LIMIT_WINDOW", "3600"))  # 1 hour

_store: dict[str, list[float]] = {}
_lock = threading.Lock()


def check_rate_limit(ip: str) -> bool:
    """Return True if the request is allowed, False if rate-limited."""
    now = time.time()
    cutoff = now - _WINDOW_SECONDS

    with _lock:
        timestamps = _store.get(ip, [])
        # Prune expired entries
        timestamps = [t for t in timestamps if t > cutoff]

        if len(timestamps) >= _MAX_REQUESTS:
            _store[ip] = timestamps
            return False

        timestamps.append(now)
        _store[ip] = timestamps
        return True


def get_limit_info() -> dict:
    """Return current config for transparency."""
    return {"max_requests": _MAX_REQUESTS, "window_seconds": _WINDOW_SECONDS}
