"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { fetchSuggestion } from "@/lib/api";
import { getPantry, savePantry } from "@/lib/pantry";
import { getFeedback, makeSignature } from "@/lib/feedback";
import { generateChallenge } from "@/lib/challenges";
import type { SuggestResponse, FlavourMode, SkillMode } from "@/lib/types";
import { LOADING_MESSAGES } from "@/lib/loading-messages";

import CookMode from "./components/CookMode";
import UpgradeLadderUI from "./components/UpgradeLadderUI";
import WhyThisWorks from "./components/WhyThisWorks";
import FeedbackButtons from "./components/FeedbackButtons";
import ShareCard from "./components/ShareCard";
import SettingsPanel from "./components/SettingsPanel";
import IngredientAutocomplete from "./components/IngredientAutocomplete";
import SkeletonLoader from "./components/SkeletonLoader";

// ── Constants ────────────────────────────────────────────────────

const DIETS = ["any", "vegetarian", "vegan", "pescatarian"];
const SPICE_LEVELS = ["mild", "medium", "hot"];
const EQUIPMENT_OPTIONS = ["hob", "oven", "microwave", "pan", "wok", "pot"];
const TIME_OPTIONS = [15, 30, 45, 60];

const FLAVOUR_MODES: { value: FlavourMode; label: string }[] = [
  { value: "bold_spicy", label: "Bold & Spicy" },
  { value: "umami", label: "Savoury & Umami" },
  { value: "comfort_rich", label: "Comfort & Rich" },
  { value: "bright_fresh", label: "Bright & Fresh" },
  { value: "clean_light", label: "Clean & Light" },
];

const PRESETS = [
  { label: "Maggi + Onion", ingredients: ["maggi noodles", "onion"] },
  { label: "Rice + Frozen veg", ingredients: ["rice", "frozen peas", "soy sauce"] },
  { label: "Pasta + Tinned tomatoes", ingredients: ["pasta", "tinned tomatoes", "garlic"] },
];

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ── Dark mode hook ──────────────────────────────────────────────

function useDarkMode() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("spice-theme", next ? "dark" : "light");
  }

  return { dark, toggle };
}

// ── Page ─────────────────────────────────────────────────────────

export default function Home() {
  const { dark, toggle: toggleDark } = useDarkMode();

  // Inputs
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [diet, setDiet] = useState("any");
  const [timeMinutes, setTimeMinutes] = useState(30);
  const [equipment, setEquipment] = useState<string[]>(["hob", "pan"]);
  const [spiceLevel, setSpiceLevel] = useState("medium");
  const [flavourMode, setFlavourMode] = useState<FlavourMode>("umami");
  const [skillMode, setSkillMode] = useState<SkillMode>("beginner");

  // Pantry
  const [pantry, setPantry] = useState<string[]>([]);
  const [pantryInput, setPantryInput] = useState("");

  // Settings panel
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Result
  const [result, setResult] = useState<SuggestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [cookModeActive, setCookModeActive] = useState(false);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);

  // Loading message rotation
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  useEffect(() => {
    if (!loading) return;
    setLoadingMsgIdx(Math.floor(Math.random() * LOADING_MESSAGES.length));
    const interval = setInterval(() => {
      setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [loading]);

  // Load pantry from localStorage
  useEffect(() => {
    setPantry(getPantry());
  }, []);

  function addIngredient(value?: string) {
    const trimmed = (value || input).trim().toLowerCase();
    if (trimmed && !ingredients.includes(trimmed)) {
      setIngredients([...ingredients, trimmed]);
    }
    if (!value) setInput("");
  }

  function removeIngredient(item: string) {
    setIngredients(ingredients.filter((i) => i !== item));
  }

  function toggleEquipment(item: string) {
    setEquipment((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]
    );
  }

  function addPantryItem() {
    const trimmed = pantryInput.trim().toLowerCase();
    if (trimmed && !pantry.includes(trimmed)) {
      const next = [...pantry, trimmed];
      setPantry(next);
      savePantry(next);
    }
    setPantryInput("");
  }

  function removePantryItem(item: string) {
    const next = pantry.filter((i) => i !== item);
    setPantry(next);
    savePantry(next);
  }

  function applyPreset(preset: { ingredients: string[] }) {
    setIngredients(preset.ingredients);
    setResult(null);
  }

  function applyChallenge() {
    const c = generateChallenge();
    setIngredients(c.ingredients);
    setTimeMinutes(c.time_minutes);
    setResult(null);
  }

  async function handleSubmit() {
    if (ingredients.length === 0) {
      toast.error("Add at least one ingredient.");
      return;
    }
    setLoading(true);
    setResult(null);

    const sig = makeSignature(ingredients, flavourMode);
    const feedbackHistory = getFeedback(sig);

    try {
      const res = await fetchSuggestion({
        ingredients,
        constraints: {
          diet: diet === "any" ? undefined : diet,
          time_minutes: timeMinutes,
          equipment,
          spice_level: spiceLevel,
          flavour_mode: flavourMode,
          skill_mode: skillMode,
        },
        pantry_items: pantry,
        feedback_history: feedbackHistory,
      });
      setResult(res);
      // Focus result heading for screen readers
      setTimeout(() => resultHeadingRef.current?.focus(), 100);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const feedbackSig = makeSignature(ingredients, flavourMode);

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      {/* Skip link */}
      <a
        href="#results"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 bg-amber-500 text-white px-3 py-2 rounded-lg"
      >
        Skip to results
      </a>

      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-3xl font-bold">
          SP<span className="text-amber-600 dark:text-amber-400" style={{ fontSize: '110%', lineHeight: 1 }}>I</span>CE
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSettingsOpen(true)}
            className="text-sm px-2.5 py-1.5 rounded-full border border-stone-300 dark:border-stone-600 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            aria-label="Settings"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={toggleDark}
            className="text-sm px-3 py-1.5 rounded-full border border-stone-300 dark:border-stone-600 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            {dark ? "Light" : "Dark"}
          </button>
        </div>
      </div>
      <p className="text-stone-500 dark:text-stone-400 mb-6">
        Smart Pantry Intelligence &amp; Culinary Engine
      </p>

      {/* Presets + Challenge */}
      <div className="flex flex-wrap gap-2 mb-6">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => applyPreset(p)}
            className="text-xs px-3 py-1.5 rounded-full border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={applyChallenge}
          className="text-xs px-3 py-1.5 rounded-full border border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
        >
          Budget Challenge
        </button>
        {ingredients.length > 0 && (
          <button
            onClick={() => { setIngredients([]); setResult(null); }}
            className="text-xs px-3 py-1.5 rounded-full border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Ingredient input */}
      <section className="mb-6">
        <label className="block font-medium mb-2">Ingredients you have</label>
        <div className="flex gap-2">
          <IngredientAutocomplete
            value={input}
            onChange={setInput}
            onSelect={addIngredient}
          />
          <button
            onClick={() => addIngredient()}
            className="bg-amber-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-600 transition-colors"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {ingredients.map((item) => (
            <span
              key={item}
              className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 px-3 py-1 rounded-full text-sm flex items-center gap-1"
            >
              {item}
              <button
                onClick={() => removeIngredient(item)}
                className="text-amber-600 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-100 ml-1"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      </section>

      {/* Flavour mode */}
      <section className="mb-6">
        <label className="block text-sm font-medium mb-2">Flavour personality</label>
        <div className="flex flex-wrap gap-2">
          {FLAVOUR_MODES.map((fm) => (
            <button
              key={fm.value}
              onClick={() => setFlavourMode(fm.value)}
              className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                flavourMode === fm.value
                  ? "bg-amber-500 text-white border-amber-500"
                  : "border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
              }`}
            >
              {fm.label}
            </button>
          ))}
        </div>
      </section>

      {/* Constraints grid */}
      <section className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Diet</label>
          <select
            value={diet}
            onChange={(e) => setDiet(e.target.value)}
            className="w-full border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 rounded-lg px-3 py-2"
          >
            {DIETS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Time (minutes)</label>
          <div className="flex flex-wrap gap-2">
            {TIME_OPTIONS.map((t) => (
              <button
                key={t}
                onClick={() => setTimeMinutes(t)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors min-h-[36px] ${
                  timeMinutes === t
                    ? "bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 border-stone-800 dark:border-stone-200"
                    : "border-stone-300 dark:border-stone-600 text-stone-500 dark:text-stone-400"
                }`}
              >
                {t} min
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Spice level</label>
          <select
            value={spiceLevel}
            onChange={(e) => setSpiceLevel(e.target.value)}
            className="w-full border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 rounded-lg px-3 py-2"
          >
            {SPICE_LEVELS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Equipment</label>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT_OPTIONS.map((eq) => (
              <button
                key={eq}
                onClick={() => toggleEquipment(eq)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors min-h-[36px] ${
                  equipment.includes(eq)
                    ? "bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 border-stone-800 dark:border-stone-200"
                    : "border-stone-300 dark:border-stone-600 text-stone-500 dark:text-stone-400"
                }`}
              >
                {eq}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 py-3 rounded-lg font-medium hover:bg-stone-900 dark:hover:bg-stone-300 disabled:opacity-50 mb-8 transition-colors"
      >
        {loading ? LOADING_MESSAGES[loadingMsgIdx] : "What can I make?"}
      </button>

      {/* Loading skeleton */}
      {loading && <SkeletonLoader />}

      {/* ── Result ──────────────────────────────────────────────── */}
      <div id="results" aria-live="polite">
      {result && (
        <div className="space-y-6">
          {/* Header with badges */}
          <div className="animate-fade-in-up">
            <h2 ref={resultHeadingRef} tabIndex={-1} className="text-2xl font-bold outline-none">{result.title}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-xs bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded-full">
                ~{result.prep_time_minutes} min
              </span>
              <span className="text-xs bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded-full">
                {ingredients.length} ingredients
              </span>
              {result.calories_estimate && (
                <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                  ~{result.calories_estimate} cal
                </span>
              )}
              {result.flavour_mode && (
                <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                  {FLAVOUR_MODES.find((fm) => fm.value === result.flavour_mode)?.label || result.flavour_mode}
                </span>
              )}
            </div>
          </div>

          {/* Pantry used */}
          {result.pantry_used.length > 0 && (
            <p className="text-sm text-stone-500 dark:text-stone-400 animate-fade-in-up animate-delay-1">
              Using pantry staples: {result.pantry_used.join(", ")}
            </p>
          )}

          {/* Minimal rescue */}
          {result.minimal_rescue?.enabled && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 animate-fade-in-up animate-delay-1">
              <p className="font-medium text-amber-800 dark:text-amber-300 mb-2">
                {result.minimal_rescue.rescue_line}
              </p>
              {result.minimal_rescue.flavour_hacks.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1">Flavour Hacks</p>
                  <ul className="space-y-1">
                    {result.minimal_rescue.flavour_hacks.map((h, i) => (
                      <li key={i} className="text-sm text-amber-700 dark:text-amber-300">{h}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.minimal_rescue.ask_for.length > 0 && (
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  If you have one more thing: <span className="font-medium">{result.minimal_rescue.ask_for.join(" or ")}</span>
                </p>
              )}
            </div>
          )}

          {/* Cook Mode */}
          <div className="animate-fade-in-up animate-delay-2">
            <CookMode steps={result.steps} active={cookModeActive} onActiveChange={setCookModeActive} />
          </div>

          {/* Static steps (hidden when cook mode is active) */}
          {!cookModeActive && (
            <div className="animate-fade-in-up animate-delay-3">
              <h3 className="font-semibold mb-2">Steps</h3>
              <ol className="space-y-2">
                {result.steps.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-amber-600 dark:text-amber-400 font-mono text-sm min-w-[3.5rem]">
                      {fmtTime(step.t_seconds)}
                    </span>
                    <div>
                      <span>{step.instruction}</span>
                      {step.tip && (
                        <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{step.tip}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Notes */}
          {result.notes.length > 0 && (
            <div className="animate-fade-in-up animate-delay-3">
              <h3 className="font-semibold mb-2">Notes</h3>
              <ul className="list-disc list-inside space-y-1 text-stone-600 dark:text-stone-400 text-sm">
                {result.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Why This Works */}
          <div className="animate-fade-in-up animate-delay-4">
            <WhyThisWorks reasons={result.why_this_works} />
          </div>

          {/* Upgrade Ladder */}
          <div className="animate-fade-in-up animate-delay-5">
            <UpgradeLadderUI ladder={result.upgrade_ladder} />
          </div>

          {/* Safety */}
          {result.safety.missing_ingredients.length > 0 && (
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Assumed available: {result.safety.missing_ingredients.join(", ")}.{" "}
              {result.safety.disclaimer}
            </p>
          )}

          {/* Feedback */}
          <div className="animate-fade-in-up animate-delay-6">
            <FeedbackButtons signature={feedbackSig} />
          </div>

          {/* Share */}
          <div className="animate-fade-in-up animate-delay-6">
            <ShareCard result={result} ingredientCount={ingredients.length} />
          </div>
        </div>
      )}
      </div>

      {/* Settings panel */}
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        pantry={pantry}
        pantryInput={pantryInput}
        onPantryInputChange={setPantryInput}
        onAddPantryItem={addPantryItem}
        onRemovePantryItem={removePantryItem}
        skillMode={skillMode}
        onSkillModeChange={setSkillMode}
      />

      <footer className="mt-12 py-6 text-center text-sm text-stone-400 dark:text-stone-500">
        SPICE by{" "}
        <a
          href="https://aidoo.biz"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
        >
          ai.doo
        </a>
      </footer>
    </main>
  );
}
