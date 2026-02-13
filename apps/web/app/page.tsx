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
import SavedRecipesPanel from "./components/SavedRecipesPanel";
import IngredientAutocomplete from "./components/IngredientAutocomplete";
import SkeletonLoader from "./components/SkeletonLoader";
import { Card, SectionHeader } from "./components/ui";

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

const PRESET_POOL = [
  { label: "Maggi + Onion", ingredients: ["maggi noodles", "onion"] },
  { label: "Rice + Frozen veg", ingredients: ["rice", "frozen peas", "soy sauce"] },
  { label: "Pasta + Tinned tomatoes", ingredients: ["pasta", "tinned tomatoes", "garlic"] },
  { label: "Egg + Toast", ingredients: ["egg", "bread"] },
  { label: "Beans on Toast", ingredients: ["baked beans", "bread", "butter"] },
  { label: "Ramen + Egg", ingredients: ["instant ramen", "egg", "spring onions"] },
  { label: "Chickpea stir-fry", ingredients: ["tinned chickpeas", "onion", "garlic"] },
  { label: "Omelette", ingredients: ["egg", "cheese", "butter"] },
  { label: "Tuna pasta", ingredients: ["pasta", "tinned tuna", "sweetcorn"] },
  { label: "Lentil soup", ingredients: ["red lentils", "onion", "tinned tomatoes"] },
  { label: "Couscous salad", ingredients: ["couscous", "cucumber", "lemon"] },
  { label: "Cheesy nachos", ingredients: ["tortilla chips", "cheese", "salsa"] },
  { label: "Fried rice", ingredients: ["rice", "egg", "soy sauce"] },
  { label: "Banana pancakes", ingredients: ["banana", "egg", "flour"] },
  { label: "Garlic bread", ingredients: ["bread", "butter", "garlic"] },
  { label: "Quesadilla", ingredients: ["tortilla", "cheese", "peppers"] },
  { label: "Pesto pasta", ingredients: ["pasta", "pesto", "parmesan"] },
  { label: "Stir-fry noodles", ingredients: ["noodles", "soy sauce", "frozen veg"] },
  { label: "Tomato soup", ingredients: ["tinned tomatoes", "onion", "stock cube"] },
  { label: "Jacket potato", ingredients: ["potato", "cheese", "baked beans"] },
  { label: "Sardines on toast", ingredients: ["tinned sardines", "bread", "lemon"] },
  { label: "Dal", ingredients: ["red lentils", "onion", "garlic", "tinned tomatoes"] },
  { label: "Mushroom toast", ingredients: ["mushrooms", "bread", "garlic", "butter"] },
  { label: "Veggie wrap", ingredients: ["tortilla", "lettuce", "cucumber", "hummus"] },
  { label: "Spam + Rice", ingredients: ["spam", "rice", "egg"] },
];

function pickRandomPresets(count: number) {
  const shuffled = [...PRESET_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

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

// ── Pill button helper ──────────────────────────────────────────

function Pill({ active, onClick, children, accent }: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  accent?: boolean;
}) {
  const base = "text-xs px-3 py-1.5 rounded-full border transition-colors duration-150 min-h-[36px]";
  if (accent) {
    return (
      <button onClick={onClick} className={`${base} border-amber-400/40 dark:border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20`}>
        {children}
      </button>
    );
  }
  if (active) {
    return (
      <button onClick={onClick} className={`${base} bg-[#F5F5F5] dark:bg-[#F5F5F5] text-[#111111] dark:text-[#111111] border-transparent font-medium`}>
        {children}
      </button>
    );
  }
  return (
    <button onClick={onClick} className={`${base} border-white/10 text-stone-500 dark:text-[rgba(245,245,245,0.5)] hover:text-stone-800 dark:hover:text-[#F5F5F5] hover:border-white/20`}>
      {children}
    </button>
  );
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

  // Panels
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [recipesOpen, setRecipesOpen] = useState(false);

  // Random presets
  const [visiblePresets, setVisiblePresets] = useState<typeof PRESET_POOL>([]);
  useEffect(() => { setVisiblePresets(pickRandomPresets(4)); }, []);

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
    setCookModeActive(false);

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
      setTimeout(() => resultHeadingRef.current?.focus(), 100);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const feedbackSig = makeSignature(ingredients, flavourMode);

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
      {/* Skip link */}
      <a
        href="#results"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 bg-amber-500 text-white px-3 py-2 rounded-lg"
      >
        Skip to results
      </a>

      {/* ── Top bar ──────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 -mx-4 px-4 py-3 mb-2 backdrop-blur-md bg-white/80 dark:bg-[#111111]/80 border-b border-stone-200/50 dark:border-white/5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          SP<span className="text-amber-600 dark:text-amber-400" style={{ fontSize: '110%', lineHeight: 1 }}>I</span>CE
        </h1>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setRecipesOpen(true)}
            className="p-2 rounded-lg text-stone-400 dark:text-[rgba(245,245,245,0.5)] hover:text-stone-800 dark:hover:text-[#F5F5F5] hover:bg-stone-100 dark:hover:bg-white/5 transition-colors duration-150"
            aria-label="Saved recipes"
          >
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-lg text-stone-400 dark:text-[rgba(245,245,245,0.5)] hover:text-stone-800 dark:hover:text-[#F5F5F5] hover:bg-stone-100 dark:hover:bg-white/5 transition-colors duration-150"
            aria-label="Settings"
          >
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={toggleDark}
            className="p-2 rounded-lg text-stone-400 dark:text-[rgba(245,245,245,0.5)] hover:text-stone-800 dark:hover:text-[#F5F5F5] hover:bg-stone-100 dark:hover:bg-white/5 transition-colors duration-150"
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {dark ? (
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m16.66 7.66l-.71-.71M4.05 4.05l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </div>
      </div>

      {/* ── Card stack ───────────────────────────────────────── */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-4 lg:items-start">

      {/* ── Left column: inputs ──────────────────────────────── */}
      <div className="space-y-3 lg:sticky lg:top-16">

        {/* Card 1: Ingredients */}
        <Card>
          <SectionHeader>Ingredients you have</SectionHeader>
          <div className="flex gap-2">
            <IngredientAutocomplete
              value={input}
              onChange={setInput}
              onSelect={addIngredient}
            />
            <button
              onClick={() => addIngredient()}
              className="bg-[#F5F5F5] dark:bg-[#F5F5F5] text-[#111111] px-4 py-2 rounded-lg text-sm font-medium hover:bg-white dark:hover:bg-white transition-colors duration-150"
            >
              Add
            </button>
          </div>

          {/* Ingredient tags */}
          {ingredients.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {ingredients.map((item) => (
                <span
                  key={item}
                  className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1"
                >
                  {item}
                  <button
                    onClick={() => removeIngredient(item)}
                    className="text-amber-600 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-100 ml-0.5"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Presets */}
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-stone-100 dark:border-white/5">
            {visiblePresets.map((p) => (
              <Pill key={p.label} onClick={() => applyPreset(p)}>{p.label}</Pill>
            ))}
            <Pill accent onClick={applyChallenge}>Budget Challenge</Pill>
            {ingredients.length > 0 && (
              <Pill onClick={() => { setIngredients([]); setResult(null); }}>Clear</Pill>
            )}
          </div>
        </Card>

        {/* Card 2: Flavour & Constraints */}
        <Card>
          <SectionHeader>Flavour &amp; Preferences</SectionHeader>

          {/* Flavour modes */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {FLAVOUR_MODES.map((fm) => (
              <Pill key={fm.value} active={flavourMode === fm.value} onClick={() => setFlavourMode(fm.value)}>
                {fm.label}
              </Pill>
            ))}
          </div>

          {/* Constraints rows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-stone-400 dark:text-[rgba(245,245,245,0.4)] mb-1.5">Diet</label>
              <select
                value={diet}
                onChange={(e) => setDiet(e.target.value)}
                className="w-full border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-surface-dark-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                {DIETS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-stone-400 dark:text-[rgba(245,245,245,0.4)] mb-1.5">Time</label>
              <div className="flex flex-wrap gap-1.5">
                {TIME_OPTIONS.map((t) => (
                  <Pill key={t} active={timeMinutes === t} onClick={() => setTimeMinutes(t)}>
                    {t} min
                  </Pill>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-stone-400 dark:text-[rgba(245,245,245,0.4)] mb-1.5">Spice level</label>
              <select
                value={spiceLevel}
                onChange={(e) => setSpiceLevel(e.target.value)}
                className="w-full border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-surface-dark-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                {SPICE_LEVELS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-stone-400 dark:text-[rgba(245,245,245,0.4)] mb-1.5">Equipment</label>
              <div className="flex flex-wrap gap-1.5">
                {EQUIPMENT_OPTIONS.map((eq) => (
                  <Pill key={eq} active={equipment.includes(eq)} onClick={() => toggleEquipment(eq)}>
                    {eq}
                  </Pill>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[#F5F5F5] dark:bg-[#F5F5F5] text-[#111111] py-3 rounded-xl text-sm font-semibold hover:bg-white dark:hover:bg-white disabled:opacity-50 transition-colors duration-150"
        >
          {loading ? LOADING_MESSAGES[loadingMsgIdx] : "What can I make?"}
        </button>

      </div>{/* end left column */}

      {/* ── Right column: results ────────────────────────────── */}
      <div className="space-y-3 mt-3 lg:mt-0">

        {/* Loading skeleton */}
        {loading && (
          <Card>
            <SkeletonLoader />
          </Card>
        )}

        {/* ── Results ─────────────────────────────────────────── */}
        <div id="results" aria-live="polite">
        {result && (
          <div className="space-y-3">
            {result.rejection ? (
              <Card>
                <div className="animate-fade-in-up text-center py-6">
                  <p className="text-lg font-medium text-stone-600 dark:text-[#F5F5F5]">
                    {result.rejection}
                  </p>
                  <p className="text-sm text-stone-400 dark:text-[rgba(245,245,245,0.5)] mt-2">
                    Try adding some actual food ingredients.
                  </p>
                </div>
              </Card>
            ) : (<>

            {/* Result header card */}
            <Card className="animate-fade-in-up">
              <h2 ref={resultHeadingRef} tabIndex={-1} className="text-xl sm:text-2xl font-bold outline-none leading-tight">{result.title}</h2>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[10px] bg-stone-100 dark:bg-white/10 text-stone-500 dark:text-[rgba(245,245,245,0.6)] px-2 py-0.5 rounded-full">
                  ~{result.prep_time_minutes} min
                </span>
                <span className="text-[10px] bg-stone-100 dark:bg-white/10 text-stone-500 dark:text-[rgba(245,245,245,0.6)] px-2 py-0.5 rounded-full">
                  {ingredients.length} ingredients
                </span>
                {result.calories_estimate && (
                  <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                    ~{result.calories_estimate} cal
                  </span>
                )}
                {result.flavour_mode && (
                  <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                    {FLAVOUR_MODES.find((fm) => fm.value === result.flavour_mode)?.label || result.flavour_mode}
                  </span>
                )}
              </div>

              {result.pantry_used.length > 0 && (
                <p className="text-xs text-stone-400 dark:text-[rgba(245,245,245,0.4)] mt-2">
                  Using pantry staples: {result.pantry_used.join(", ")}
                </p>
              )}
            </Card>

            {/* Minimal rescue */}
            {result.minimal_rescue?.enabled && (
              <Card className="animate-fade-in-up animate-delay-1 border-amber-200 dark:border-amber-700/50">
                <p className="font-medium text-amber-800 dark:text-amber-300 text-sm mb-2">
                  {result.minimal_rescue.rescue_line}
                </p>
                {result.minimal_rescue.flavour_hacks.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">Flavour Hacks</p>
                    <ul className="space-y-0.5">
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
              </Card>
            )}

            {/* Cook Mode card */}
            <Card className="animate-fade-in-up animate-delay-2">
              <SectionHeader>Cook Mode</SectionHeader>
              <CookMode steps={result.steps} active={cookModeActive} onActiveChange={setCookModeActive} />
            </Card>

            {/* Static steps (hidden when cook mode is active) */}
            {!cookModeActive && (
              <Card className="animate-fade-in-up animate-delay-3">
                <SectionHeader>Steps</SectionHeader>
                <ol className="space-y-2">
                  {result.steps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="text-amber-600 dark:text-amber-400 font-mono text-xs min-w-[3rem] pt-0.5">
                        {fmtTime(step.t_seconds)}
                      </span>
                      <div>
                        <span className="text-sm">{step.instruction}</span>
                        {step.tip && (
                          <p className="text-xs text-stone-400 dark:text-[rgba(245,245,245,0.4)] mt-0.5">{step.tip}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>

                {/* Notes inline */}
                {result.notes.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-stone-100 dark:border-white/5">
                    <SectionHeader>Notes</SectionHeader>
                    <ul className="space-y-1">
                      {result.notes.map((n, i) => (
                        <li key={i} className="text-sm text-stone-500 dark:text-[rgba(245,245,245,0.5)]">{n}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Safety disclaimer inline */}
                {result.safety.missing_ingredients.length > 0 && (
                  <p className="text-xs text-stone-400 dark:text-[rgba(245,245,245,0.35)] mt-3">
                    Assumed available: {result.safety.missing_ingredients.join(", ")}.{" "}
                    {result.safety.disclaimer}
                  </p>
                )}
              </Card>
            )}

            {/* Why This Works */}
            <Card className="animate-fade-in-up animate-delay-4">
              <SectionHeader>Why This Works</SectionHeader>
              <WhyThisWorks reasons={result.why_this_works} />
            </Card>

            {/* Upgrade Ladder */}
            <Card className="animate-fade-in-up animate-delay-5">
              <SectionHeader>Upgrade Ladder</SectionHeader>
              <UpgradeLadderUI ladder={result.upgrade_ladder} />
            </Card>

            {/* Feedback + Share */}
            <Card className="animate-fade-in-up animate-delay-6">
              <div className="flex flex-wrap items-center gap-2">
                <FeedbackButtons signature={feedbackSig} />
                <ShareCard result={result} ingredientCount={ingredients.length} className="ml-auto shrink-0" />
              </div>
            </Card>

            </>)}
          </div>
        )}
        </div>

      </div>{/* end right column */}
      </div>{/* end grid */}

      {/* Saved recipes panel */}
      <SavedRecipesPanel
        open={recipesOpen}
        onClose={() => setRecipesOpen(false)}
        onLoad={(r) => setResult(r)}
      />

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

      <footer className="mt-8 py-4 text-center text-xs text-stone-400 dark:text-[rgba(245,245,245,0.3)]">
        SPICE by{" "}
        <a
          href="https://aidoo.biz"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-stone-600 dark:hover:text-[rgba(245,245,245,0.6)] transition-colors duration-150"
        >
          ai.doo
        </a>
      </footer>
    </main>
  );
}
