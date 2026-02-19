# SPICE Build Instructions

This repo is a small monorepo with a FastAPI backend and a Next.js frontend.

## Project layout

```
apps/
  api/          FastAPI backend (Python)
  web/          Next.js frontend (TypeScript + Tailwind)
packages/
  shared/       Shared Pydantic + TypeScript types
```

## Web (Next.js)

Local dev:

```bash
cd apps/web
npm install
npm run dev
```

Production build:

```bash
cd apps/web
npm run build
npm run start
```

The dev server runs on port `3737` by default (see `apps/web/package.json`).

Environment (web):

- `NEXT_PUBLIC_SITE_URL` (base URL for metadata, sitemap, robots)
- `NEXT_PUBLIC_API_URL` (API proxy target for local/dev)

E2E tests (Playwright):

```bash
cd apps/web
npx playwright install
npm run test:e2e
```

## API (FastAPI)

Local dev:

```bash
cd apps/api
pip install -r requirements.txt
make api
```

The API runs on port `5000` by default.

## Docker Compose

From the repo root:

```bash
docker compose up --build
```

With OpenAI enabled:

```bash
echo "OPENAI_API_KEY=sk-your-key" > .env
docker compose up --build
```

Service URLs:

- API: `http://localhost:5000`
- Web: `http://localhost:3737`

## Tests (API)

```bash
cd apps/api
PYTHONPATH="../../packages:." python -m pytest tests/ -v
```

## Environment variables (common)

These are defined in `README.md` and used by the API:

- `OPENAI_API_KEY`
- `CORS_ORIGINS`
- `RATE_LIMIT_MAX`
- `RATE_LIMIT_WINDOW`
- `DB_PATH`
- `LOG_LEVEL`

## Notes

- The web app uses Tailwind v4 via `apps/web/app/globals.css`.
- Next.js telemetry is enabled by default in builds. You can opt out via:

```bash
npx next telemetry disable
```

## Production checklist (VPS)

- Set `NEXT_PUBLIC_SITE_URL=https://spice.aidoo.biz` in the VPS environment.
- Ensure Docker Compose picks up that env value before `docker compose up --build`.
- After deploy, verify:
  - `https://spice.aidoo.biz/robots.txt`
  - `https://spice.aidoo.biz/sitemap.xml`
  - `https://spice.aidoo.biz` loads
