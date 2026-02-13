# Changelog

All notable changes to SPICE are documented here.

## [0.4.0] - 2026-02-12

### Added
- Randomised suggestion presets from a pool of 25 budget-friendly combos
- Amber "I" favicon matching the SPICE wordmark
- Witty rejection messages for non-food ingredients (e.g. "headphones")
- Saved recipes panel with bookmark icon in header
- `rejection` field in response schema for non-food detection

### Changed
- Removed "(minutes)" from Time label (bubbles already show units)
- Moved subtitle into settings panel footer to declutter header

### Fixed
- Rejection-only responses no longer fail schema validation

## [0.3.0] - 2026-02-12

### Added
- Clear button to remove all ingredients
- Time bubble selector (15/30/45/60 min) replacing number input
- SPICE wordmark with branded amber "I"
- Footer with ai.doo link
- Loading messages on submit button
- LLM prompt rule to correct ingredient typos

### Changed
- Default to dark mode for new visitors
- Renamed cook mode "Reset" button to "Stop"

### Fixed
- Cook timer now auto-stops when regenerating a recipe
- Removed duplicate loading message from skeleton loader
- Replaced build-time Next.js rewrites with runtime Route Handler proxy

## [0.2.0] - 2026-02-12

### Added
- Calorie estimates in schema, prompt, mocks, and UI badge
- Settings panel (gear icon) with pantry staples and skill level
- Ingredient autocomplete with ~130 common UK grocery items
- Rotating fun loading messages in skeleton loader
- Share card with Web Share API, background PNG export, and save to localStorage
- Calorie estimate tests

### Changed
- Lifted CookMode state to parent for cross-component control
- Reordered result sections (notes near steps, WhyThisWorks always visible)

## [0.1.0] - 2026-02-12

### Added
- Inter font, brand colour palette, and dark mode support
- Loading skeleton with staggered fade-in animations
- Smooth expand/collapse and responsive grid layout
- Toast notifications with sonner
- Accessibility attributes, error boundary, and OG meta tags
- CookMode audio ding, step skip, and large text
- Health endpoint, CORS lockdown, timeouts, and structured errors
- Hardened Dockerfiles for production
- Tests for health endpoint, CORS, and edge cases

## [0.0.1] - 2026-02-12

### Added
- Monorepo scaffold with shared Pydantic + TypeScript types
- FastAPI backend with mocked `/v1/suggest` endpoint
- Next.js frontend with ingredient input and result display
- OpenAI integration for meal suggestion generation
- Premium schema: flavour modes, pantry, cook mode, upgrade ladder, share
- Rewritten prompt and OpenAI service for premium features
- Docker Compose setup with API and web services
- Comprehensive API test suite
