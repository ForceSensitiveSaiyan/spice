export interface ChangelogEntry {
  version: string;
  date: string;
  changes: { type: "added" | "changed" | "fixed"; text: string }[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "0.5.1",
    date: "2026-02-13",
    changes: [
      { type: "added", text: "Feedback email link in footer" },
      { type: "added", text: "Air fryer equipment option" },
      { type: "added", text: "Umami self-hosted analytics" },
      { type: "added", text: "GitHub Actions auto-deploy" },
      { type: "added", text: "In-app changelog in settings" },
      { type: "changed", text: "Footer simplified to © 2026 ai.doo" },
    ],
  },
  {
    version: "0.5.0",
    date: "2026-02-12",
    changes: [
      { type: "added", text: "Community combo tracking" },
      { type: "added", text: "Community ratings breakdown" },
      { type: "added", text: "Feedback endpoint (POST /v1/feedback)" },
      { type: "added", text: "Personal stats (recipes, saves, streak)" },
      { type: "added", text: "Per-IP rate limiting" },
      { type: "added", text: "Sticky frosted glass header" },
      { type: "added", text: "Native share sheet on mobile" },
      { type: "added", text: "16 new tests (42 total)" },
      { type: "changed", text: "Single uvicorn worker for SQLite safety" },
      { type: "changed", text: "CORS locked down in Docker" },
      { type: "fixed", text: "Share/save buttons stay right-aligned" },
      { type: "fixed", text: "Export card no longer pushes layout" },
    ],
  },
  {
    version: "0.4.0",
    date: "2026-02-12",
    changes: [
      { type: "added", text: "Randomised suggestion presets" },
      { type: "added", text: "Amber favicon matching wordmark" },
      { type: "added", text: "Witty rejection messages for non-food" },
      { type: "added", text: "Saved recipes panel" },
      { type: "changed", text: "Subtitle moved to settings footer" },
      { type: "fixed", text: "Rejection responses pass validation" },
    ],
  },
  {
    version: "0.3.0",
    date: "2026-02-12",
    changes: [
      { type: "added", text: "Clear button for ingredients" },
      { type: "added", text: "Time bubble selector" },
      { type: "added", text: "SPICE wordmark with branded amber I" },
      { type: "added", text: "Loading messages on submit" },
      { type: "changed", text: "Default to dark mode" },
      { type: "fixed", text: "Cook timer auto-stops on regenerate" },
    ],
  },
  {
    version: "0.2.0",
    date: "2026-02-12",
    changes: [
      { type: "added", text: "Calorie estimates" },
      { type: "added", text: "Settings panel with pantry staples" },
      { type: "added", text: "Ingredient autocomplete" },
      { type: "added", text: "Share card with PNG export" },
    ],
  },
  {
    version: "0.1.0",
    date: "2026-02-12",
    changes: [
      { type: "added", text: "Dark mode and Inter font" },
      { type: "added", text: "Loading skeleton animations" },
      { type: "added", text: "Cook mode with audio ding" },
      { type: "added", text: "Health endpoint and CORS" },
      { type: "added", text: "Hardened Dockerfiles" },
    ],
  },
  {
    version: "0.0.1",
    date: "2026-02-12",
    changes: [
      { type: "added", text: "Monorepo scaffold" },
      { type: "added", text: "FastAPI backend with mocked endpoint" },
      { type: "added", text: "Next.js frontend" },
      { type: "added", text: "OpenAI integration" },
    ],
  },
];
