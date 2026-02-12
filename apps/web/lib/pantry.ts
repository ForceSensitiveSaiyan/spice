/** Pantry memory – localStorage-backed "always available" items. */

const STORAGE_KEY = "spice_pantry";

export function getPantry(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function savePantry(items: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
