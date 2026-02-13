/** Personal stats – localStorage-backed. */

const STORAGE_KEY = "spice_stats";

export interface PersonalStats {
  recipes_generated: number;
  recipes_saved: number;
  streak_days: number;
  last_active_date: string; // ISO date "YYYY-MM-DD"
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function getStore(): PersonalStats {
  if (typeof window === "undefined") {
    return { recipes_generated: 0, recipes_saved: 0, streak_days: 0, last_active_date: "" };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { recipes_generated: 0, recipes_saved: 0, streak_days: 0, last_active_date: "" };
    return JSON.parse(raw);
  } catch {
    return { recipes_generated: 0, recipes_saved: 0, streak_days: 0, last_active_date: "" };
  }
}

function save(stats: PersonalStats) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

export function getStats(): PersonalStats {
  return getStore();
}

export function recordGeneration(): void {
  const s = getStore();
  s.recipes_generated += 1;
  save(s);
}

export function recordSave(): void {
  const s = getStore();
  s.recipes_saved += 1;
  save(s);
}

export function updateStreak(): void {
  const s = getStore();
  const t = today();

  if (s.last_active_date === t) return; // already active today

  const last = s.last_active_date ? new Date(s.last_active_date) : null;
  const now = new Date(t);

  if (last) {
    const diffMs = now.getTime() - last.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      s.streak_days += 1;
    } else {
      s.streak_days = 1;
    }
  } else {
    s.streak_days = 1;
  }

  s.last_active_date = t;
  save(s);
}
