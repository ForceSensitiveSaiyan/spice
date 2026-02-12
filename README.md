# SPICE – Smart Pantry Intelligence & Culinary Engine

Tell SPICE what ingredients you have. It gives you a step-by-step meal plan with timing, optional upgrades, and a cheap-addition suggestion.

## Project structure

```
apps/
  api/          FastAPI backend (Python)
  web/          Next.js frontend (TypeScript)
packages/
  shared/       Pydantic models + TypeScript types
```

## Quick start

### Prerequisites

- Python 3.12+
- Node.js 20+
- (Optional) OpenAI API key for AI-powered suggestions

### API

```bash
cd apps/api
pip install -r requirements.txt
cp .env.example .env          # add your OPENAI_API_KEY (optional)

# Run (from repo root):
make api
# or directly:
PYTHONPATH="../../packages:." uvicorn spice.main:app --reload --port 5000
```

Without an `OPENAI_API_KEY`, the API returns mock responses – useful for frontend development.

### Web

```bash
cd apps/web
npm install
cp .env.example .env.local

# Run (from repo root):
make web
# or directly:
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Both at once

```bash
make dev
```

### Docker Compose (recommended)

The easiest way to run everything — no local Python/Node required:

```bash
# Without OpenAI (mock responses):
docker compose up --build

# With OpenAI:
OPENAI_API_KEY=sk-your-key docker compose up --build
```

This starts the API on [localhost:5000](http://localhost:5000) and the web UI on [localhost:3000](http://localhost:3000). The web container automatically talks to the API container by service name.

## API

### `POST /v1/suggest`

**Request:**

```json
{
  "ingredients": ["maggi noodles", "onion"],
  "constraints": {
    "diet": "vegetarian",
    "time_minutes": 15,
    "equipment": ["hob", "pan"],
    "spice_level": "medium"
  }
}
```

**Response:** See `packages/shared/schemas.py` for the full schema. Includes: title, timed steps, upgrades (gated by missing ingredients), a cheap-addition suggestion, notes, and safety info.

## Tests

```bash
cd apps/api
PYTHONPATH="../../packages:." python -m pytest tests/ -v
```

## Sample fixtures

See `apps/api/fixtures/samples.json` for example ingredient sets you can POST to the API.
