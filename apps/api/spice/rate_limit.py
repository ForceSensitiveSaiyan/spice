"""Simple in-memory per-IP rate limiter for the suggest endpoint."""

import os
import time
import threading

# Configurable via env: max requests per window per IP
_MAX_REQUESTS = int(os.environ.get("RATE_LIMIT_MAX", "20"))
_WINDOW_SECONDS = int(os.environ.get("RATE_LIMIT_WINDOW", "3600"))  # 1 hour

_store: dict[str, list[float]] = {}
_lock = threading.Lock()
_last_cleanup = 0.0
_CLEANUP_INTERVAL = 300  # purge stale IPs every 5 minutes
_MAX_STORE_SIZE = 10000  # cap to prevent unbounded memory growth


def check_rate_limit(ip: str) -> bool:
    """Return True if the request is allowed, False if rate-limited."""
    global _last_cleanup
    now = time.time()
    cutoff = now - _WINDOW_SECONDS

    with _lock:
        # Periodic cleanup: remove IPs with no recent activity
        if now - _last_cleanup > _CLEANUP_INTERVAL or len(_store) > _MAX_STORE_SIZE:
            stale = [k for k, v in _store.items() if not v or v[-1] <= cutoff]
            for k in stale:
                del _store[k]
            # If still over cap, evict oldest entries
            if len(_store) > _MAX_STORE_SIZE:
                by_age = sorted(_store.items(), key=lambda kv: kv[1][-1] if kv[1] else 0)
                for k, _ in by_age[:len(_store) - _MAX_STORE_SIZE]:
                    del _store[k]
            _last_cleanup = now

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
