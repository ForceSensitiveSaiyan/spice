# SPICE — Smart Pantry Intelligence & Culinary Engine

Ingredient-to-meal-plan app. Enter what you have, get recipe suggestions and weekly meal plans.

**Version:** v0.5.2

## Build & Run

```bash
docker compose up -d --build
```

Native dev:

```bash
# API
cd apps/api && python3 -m pip install -e ".[dev]"
PYTHONPATH="../../packages:." python3 -m uvicorn spice.main:app --reload

# Web
cd apps/web && npm install && npm run dev
```

## Test

```bash
# API tests
cd apps/api && PYTHONPATH="../../packages:." python3 -m pytest --tb=short

# Web tests
cd apps/web && npm test

# E2E
cd apps/web && npx playwright test
```

## Lint

```bash
python3 -m ruff check apps/api/
python3 -m ruff format --check apps/api/
```

## Project Structure

```
spice/
├── apps/
│   ├── api/               # FastAPI backend
│   │   ├── spice/         # source package
│   │   ├── tests/
│   │   └── pyproject.toml
│   └── web/               # Next.js frontend
│       ├── app/
│       ├── components/
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   └── shared/            # shared types (Pydantic + TypeScript)
├── docker-compose.yml
├── Makefile
├── cliff.toml
└── CHANGELOG.md
```

## Architecture Notes

- **Monorepo:** `apps/api` (FastAPI), `apps/web` (Next.js), `packages/shared` (cross-language types)
- **PYTHONPATH:** shared packages require `PYTHONPATH="../../packages:."` when running outside Docker
- **Dual test suites:** pytest for API, vitest for web, Playwright for E2E
- **Shared types:** Pydantic models in `packages/shared/` mirrored as TypeScript types

## Key Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_BASE_URL` | `http://ollama:11434` | Ollama endpoint |
| `OLLAMA_MODEL` | `llama3.2:3b` | Model for suggestions |
| `DATABASE_URL` | — | Database connection string |

## Things to Watch Out For

- Always set `PYTHONPATH` when running API outside Docker — shared packages won't resolve otherwise
- On Windows, use `;` as path separator: `PYTHONPATH="../../packages;."`
- Frontend and API have separate dependency management
- Playwright tests require `npx playwright install` first
