Run the SPICE test suites (API + Web).

```bash
# API tests
cd apps/api && PYTHONPATH="../../packages:." python3 -m pytest --tb=short

# Web tests
cd apps/web && npm test
```

Report results for both suites: total tests, passed, failed. If any tests fail, show the failure output.
