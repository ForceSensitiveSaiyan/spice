"use client";

import { useEffect, useRef } from "react";
import type { SkillMode } from "@/lib/types";
import type { PersonalStats } from "@/lib/stats";

interface Props {
  open: boolean;
  onClose: () => void;
  pantry: string[];
  pantryInput: string;
  onPantryInputChange: (value: string) => void;
  onAddPantryItem: () => void;
  onRemovePantryItem: (item: string) => void;
  skillMode: SkillMode;
  onSkillModeChange: (mode: SkillMode) => void;
  stats?: PersonalStats;
}

export default function SettingsPanel({
  open,
  onClose,
  pantry,
  pantryInput,
  onPantryInputChange,
  onAddPantryItem,
  onRemovePantryItem,
  skillMode,
  onSkillModeChange,
  stats,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Trap focus and handle Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 dark:bg-black/50"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative w-full max-w-sm bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-700 shadow-xl overflow-y-auto flex flex-col"
        role="dialog"
        aria-label="Settings"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-700">
          <h2 className="font-bold text-lg">Settings</h2>
          <button
            onClick={onClose}
            className="text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close settings"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Skill mode */}
          <section>
            <label className="block text-sm font-medium mb-2">Skill level</label>
            <div className="flex gap-2">
              <button
                onClick={() => onSkillModeChange("beginner")}
                className={`text-sm px-4 py-2 rounded-full border transition-colors ${
                  skillMode === "beginner"
                    ? "bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 border-stone-800 dark:border-stone-200"
                    : "border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                }`}
              >
                Beginner
              </button>
              <button
                onClick={() => onSkillModeChange("confident")}
                className={`text-sm px-4 py-2 rounded-full border transition-colors ${
                  skillMode === "confident"
                    ? "bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 border-stone-800 dark:border-stone-200"
                    : "border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                }`}
              >
                Confident
              </button>
            </div>
          </section>

          {/* Pantry staples */}
          <section>
            <label className="block text-sm font-medium mb-2">
              Pantry staples ({pantry.length})
            </label>
            <p className="text-xs text-stone-400 dark:text-stone-500 mb-2">
              Things you always have at home (oil, salt, etc.)
            </p>
            <div className="flex gap-2 mb-3">
              <input
                className="flex-1 border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="e.g. oil, salt, soy sauce"
                value={pantryInput}
                onChange={(e) => onPantryInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onAddPantryItem();
                  }
                }}
              />
              <button
                onClick={onAddPantryItem}
                className="text-sm bg-stone-700 dark:bg-stone-600 text-white px-3 py-2 rounded-lg hover:bg-stone-800 dark:hover:bg-stone-500 transition-colors min-h-[44px]"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {pantry.map((item) => (
                <span
                  key={item}
                  className="bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 px-2 py-0.5 rounded-full text-xs flex items-center gap-1"
                >
                  {item}
                  <button
                    onClick={() => onRemovePantryItem(item)}
                    className="text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 min-w-[20px] min-h-[20px] flex items-center justify-center"
                  >
                    &times;
                  </button>
                </span>
              ))}
              {pantry.length === 0 && (
                <span className="text-xs text-stone-400 dark:text-stone-500">
                  No pantry items yet.
                </span>
              )}
            </div>
          </section>
        </div>

        {stats && (stats.recipes_generated > 0 || stats.streak_days > 0) && (
          <div className="px-4 pb-2">
            <section>
              <label className="block text-sm font-medium mb-2">Your stats</label>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs px-3 py-1.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                  {stats.recipes_generated} {stats.recipes_generated === 1 ? "recipe" : "recipes"} generated
                </span>
                <span className="text-xs px-3 py-1.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                  {stats.recipes_saved} saved
                </span>
                {stats.streak_days > 0 && (
                  <span className="text-xs px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                    {stats.streak_days} day streak
                  </span>
                )}
              </div>
            </section>
          </div>
        )}

        <div className="p-4 border-t border-stone-200 dark:border-stone-700 mt-auto">
          <p className="text-xs text-stone-400 dark:text-stone-500 text-center">
            Smart Pantry Intelligence &amp; Culinary Engine
          </p>
        </div>
      </div>
    </div>
  );
}
