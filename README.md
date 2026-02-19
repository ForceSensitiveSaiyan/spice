# SPICE – Smart Pantry Intelligence & Culinary Engine

Tell SPICE what ingredients you have. It gives you a step-by-step meal plan with timing, upgrade ladder, flavour reasoning, and a shareable card.

## Features

- **Flavour Personality Modes**: Bold & Spicy, Savoury & Umami, Comfort & Rich, Bright & Fresh, Clean & Light
- **Upgrade Ladder**: Tiered suggestions — pantry upgrades, "if you have" gated additions, £1 shop add-ons
- **Cook Mode**: Live timeline with timer, step highlighting, pause/reset
- **Why This Works**: Expandable flavour logic in plain language
- **Minimal Meal Rescue**: Even with 1 ingredient, get a viable plan + flavour hacks
- **Pantry Memory**: Save "always available" items (localStorage) — used transparently
- **Community Combo Tracking**: See how many others cooked the same ingredient combo
- **Community Ratings**: Aggregated feedback breakdown across all users per combo
- **Taste Feedback**: Rate results → future suggestions adapt via LLM prompt context
- **Personal Stats**: Track recipes generated, saved, and daily streak (localStorage)
- **Share Cards**: Download branded PNG with title, time, ingredient count (+ native share on mobile)
- **Budget Challenge**: Random 3-ingredient, £3, 15-min challenge
- **Dual Skill Mode**: Beginner (explicit) vs Confident (intuitive)
- **Saved Recipes**: Bookmark recipes to localStorage for later
- **Rate Limiting**: Per-IP sliding window (configurable via env vars)
- **First-time Tutorial**: Guided walkthrough with a re-open option in Settings
- **SEO Ready**: Metadata, sitemap, and robots.txt routes built in

## Project structure

```
apps/
  api/          FastAPI backend (Python)
  web/          Next.js frontend (TypeScript + Tailwind)
packages/
  shared/       Pydantic models + TypeScript types
```

## Quick start

See `INSTRUCTIONS.md` for a concise build/run checklist.

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

**Response:** Includes `title`, `prep_time_minutes`, `steps` (with `t_seconds` + `tip`), `why_this_works`, `upgrade_ladder` (pantry/if_you_have/one_pound_shop), `minimal_rescue`, `pantry_used`, `notes`, `safety`, `community` (combo_count, feedback_breakdown, total_feedback).

### `POST /v1/feedback`

**Request:**

```json
{
  "combo_signature": "egg,onion,rice|umami",
  "feedback_type": "perfect"
}
```

**Response:** `{ "status": "ok", "feedback_breakdown": { "perfect": 100 }, "total_feedback": 1 }`

See `packages/shared/schemas.py` for the full schema.

## Configuration

| Variable | Default | Description |
|---|---|---|
| `OPENAI_API_KEY` | — | OpenAI key (omit for mock mode) |
| `CORS_ORIGINS` | `http://localhost:3737` | Comma-separated allowed origins |
| `RATE_LIMIT_MAX` | `20` | Max requests per IP per window |
| `RATE_LIMIT_WINDOW` | `3600` | Rate limit window in seconds |
| `DB_PATH` | `spice/data/spice.db` | SQLite database path |
| `LOG_LEVEL` | `info` | Logging level |

### Web environment

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3737` | Base URL used for metadata, sitemap, and robots |

## Deploy workflow

Pushes to `master` trigger:

- API tests (pytest)
- Web build + E2E tests (Playwright)
- VPS deploy via SSH with post-deploy smoke checks (`/health`, `/robots.txt`, `/sitemap.xml`)

On the VPS, set `NEXT_PUBLIC_SITE_URL=https://spice.aidoo.biz` in the environment used by Docker Compose.

## Tests

### Web (E2E)

```bash
cd apps/web
npm run test:e2e
```

Install browser binaries if needed:

```bash
npx playwright install
```

### API

```bash
cd apps/api
PYTHONPATH="../../packages:." python -m pytest tests/ -v
```

42 tests covering: input validation, schema compliance, step ordering, upgrade gating, minimal rescue, JSON parsing robustness, feedback mapping, calorie estimates, rejection handling, health/CORS, community tracking (combo counting, feedback endpoint, 404 on unknown combo), rate limiting (429 response), database operations (hashing, upsert, feedback breakdown), rate limiter logic (expiry, cleanup, IP isolation).
