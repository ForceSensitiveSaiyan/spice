"""Test configuration — initialise in-memory DB before any test runs."""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "packages"))

# Use in-memory SQLite for tests (fast, isolated)
os.environ["DB_PATH"] = ":memory:"

from spice.db import init_db  # noqa: E402

# Initialise once per test session
init_db()
