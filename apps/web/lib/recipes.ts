import type { SuggestResponse } from "./types";

export interface SavedRecipe {
  id: string;
  timestamp: number;
  result: SuggestResponse;
  ingredientCount: number;
}

const STORAGE_KEY = "spice_saved_recipes";
const MAX_RECIPES = 20;

export function getSavedRecipes(): SavedRecipe[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveRecipe(result: SuggestResponse, ingredientCount: number): SavedRecipe {
  const recipe: SavedRecipe = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    result,
    ingredientCount,
  };
  const existing = getSavedRecipes();
  const updated = [recipe, ...existing].slice(0, MAX_RECIPES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return recipe;
}

export function deleteRecipe(id: string): void {
  const existing = getSavedRecipes();
  const updated = existing.filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}
