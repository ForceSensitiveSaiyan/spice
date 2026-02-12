# SPICE – Smart Pantry Intelligence & Culinary Engine

Tell SPICE what ingredients you have. It gives you a step-by-step meal plan with timing, upgrade ladder, flavour reasoning, and a shareable card.

## Features

- **Flavour Personality Modes**: Bold & Spicy, Savoury & Umami, Comfort & Rich, Bright & Fresh, Clean & Light
- **Upgrade Ladder**: Tiered suggestions — pantry upgrades, "if you have" gated additions, £1 shop add-ons
- **Cook Mode**: Live timeline with timer, step highlighting, pause/reset
- **Why This Works**: Expandable flavour logic in plain language
- **Minimal Meal Rescue**: Even with 1 ingredient, get a viable plan + flavour hacks
- **Pantry Memory**: Save "always available" items (localStorage) — used transparently
- **Taste Feedback**: Rate results → future suggestions adapt
- **Share Cards**: Download branded PNG with title, time, ingredient count
- **Budget Challenge**: Random 3-ingredient, £3, 15-min challenge
- **Dual Skill Mode**: Beginner (explicit) vs Confident (intuitive)

## Project structure

```
apps/
  api/          FastAPI backend (Python)
  web/          Next.js frontend (TypeScript + Tailwind)
packages/
  shared/       Pydantic models + TypeScript types
```

## Quick start

### Docker Compose (recommended)

```bash
# Without OpenAI (mock responses):
docker compose up --build

# With OpenAI — create .env in repo root:
echo "OPENAI_API_KEY=sk-your-key" > .env
docker compose up --build
```

API: [localhost:5000](http://localhost:5000) | Web: [localhost:3737](http://localhost:3737)

### Local dev

```bash
# API
cd apps/api && pip install -r requirements.txt
make api   # starts on :5000

# Web
cd apps/web && npm install
make web   # starts on :3737
```

Without `OPENAI_API_KEY`, the API returns mock responses.

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
    "spice_level": "medium",
    "flavour_mode": "umami",
    "skill_mode": "beginner"
  },
  "pantry_items": ["oil", "salt"],
  "feedback_history": ["too_bland"]
}
```

**Response:** Includes `title`, `prep_time_minutes`, `steps` (with `t_seconds` + `tip`), `why_this_works`, `upgrade_ladder` (pantry/if_you_have/one_pound_shop), `minimal_rescue`, `pantry_used`, `notes`, `safety`.

See `packages/shared/schemas.py` for the full schema.

## Tests

```bash
cd apps/api
PYTHONPATH="../../packages:." python -m pytest tests/ -v
```

13 tests covering: input validation, schema compliance, step ordering, upgrade gating (no hallucinated ingredients), minimal rescue, new request fields, JSON parsing robustness, feedback mapping.
