"""Test configuration — initialise in-memory DB before any test runs."""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "packages"))

# Use in-memory SQLite for tests (fast, isolated)
os.environ["DB_PATH"] = ":memory:"

# Ensure tests use mock responses (no real OpenAI calls).
# Must be set before imports AND after, because load_dotenv() in
# openai_service.py re-loads from .env at import time.
os.environ.pop("OPENAI_API_KEY", None)

from spice.db import init_db  # noqa: E402
import spice.openai_service as _oai  # noqa: E402

# Re-clear after imports (load_dotenv may have restored it)
os.environ.pop("OPENAI_API_KEY", None)
_oai._client = None

# Initialise once per test session
init_db()
