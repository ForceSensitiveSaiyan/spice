/** Taste feedback storage – localStorage-backed per recipe signature. */

import type { FeedbackType, FlavourMode } from "./types";

const STORAGE_KEY = "spice_feedback";

/**
 * Lowercase, trim, and collapse internal whitespace.
 * Must stay in lockstep with the backend `normalize_ingredient` in db.py so
 * combo signatures match across client and server.
 */
export function normalizeIngredient(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Signature = normalized, sorted ingredients + flavour_mode */
export function makeSignature(ingredients: string[], flavourMode?: FlavourMode): string {
  return ingredients.map(normalizeIngredient).sort().join(",") + "|" + (flavourMode || "none");
}

type FeedbackStore = Record<string, FeedbackType[]>;

function getStore(): FeedbackStore {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function getFeedback(sig: string): FeedbackType[] {
  return getStore()[sig] || [];
}

export function saveFeedback(sig: string, feedback: FeedbackType) {
  const store = getStore();
  const existing = store[sig] || [];
  // Keep last 5 feedback entries per signature
  store[sig] = [...existing, feedback].slice(-5);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}
