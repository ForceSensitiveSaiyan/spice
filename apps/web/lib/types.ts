/** SPICE client types – mirrors /packages/shared/types.ts */

export type FlavourMode =
  | "bold_spicy"
  | "umami"
  | "comfort_rich"
  | "bright_fresh"
  | "clean_light";

export type SkillMode = "beginner" | "confident";

export type FeedbackType = "too_salty" | "too_bland" | "perfect" | "needs_spice";

// ── Request ──────────────────────────────────────────────────────

export interface Constraints {
  diet?: string;
  time_minutes?: number;
  equipment?: string[];
  spice_level?: string;
  flavour_mode?: FlavourMode;
  skill_mode?: SkillMode;
}

export interface SuggestRequest {
  ingredients: string[];
  constraints?: Constraints;
  pantry_items?: string[];
  feedback_history?: FeedbackType[];
}

// ── Response ─────────────────────────────────────────────────────

export interface Step {
  t_seconds: number;
  instruction: string;
  tip?: string;
}

export interface Upgrade {
  requires: string;
  why: string;
  how: string;
}

export interface UpgradeLadder {
  pantry_upgrade: Upgrade[];
  if_you_have: Upgrade[];
  one_pound_shop: Upgrade | null;
}

export interface MinimalRescue {
  enabled: boolean;
  flavour_hacks: string[];
  ask_for: string[];
  rescue_line: string;
}

export interface Safety {
  assumptions: string[];
  missing_ingredients: string[];
  disclaimer: string;
}

export interface SuggestResponse {
  title: string;
  prep_time_minutes: number;
  flavour_mode?: FlavourMode;
  steps: Step[];
  why_this_works: string[];
  upgrade_ladder: UpgradeLadder;
  minimal_rescue?: MinimalRescue;
  pantry_used: string[];
  notes: string[];
  safety: Safety;
}
