/** Shared types – mirrors /packages/shared/types.ts */

export interface Constraints {
  diet?: string;
  time_minutes?: number;
  equipment?: string[];
  spice_level?: string;
}

export interface SuggestRequest {
  ingredients: string[];
  constraints?: Constraints;
}

export interface Step {
  t: number;
  instruction: string;
}

export interface Upgrade {
  requires: string;
  why: string;
  how: string;
}

export interface CheapAddition {
  item: string;
  why: string;
  cost_note: string;
}

export interface Safety {
  assumptions: string[];
  missing_ingredients: string[];
  disclaimer: string;
}

export interface SuggestResponse {
  title: string;
  prep_time_minutes: number;
  steps: Step[];
  upgrades: Upgrade[];
  one_cheapest_addition?: CheapAddition;
  notes: string[];
  safety: Safety;
}
