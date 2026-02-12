"use client";

import { useState, useEffect } from "react";
import { fetchSuggestion } from "@/lib/api";
import { getPantry, savePantry } from "@/lib/pantry";
import { getFeedback, makeSignature } from "@/lib/feedback";
import { generateChallenge } from "@/lib/challenges";
import type { SuggestResponse, FlavourMode, SkillMode } from "@/lib/types";

import CookMode from "./components/CookMode";
import UpgradeLadderUI from "./components/UpgradeLadderUI";
import WhyThisWorks from "./components/WhyThisWorks";
import FeedbackButtons from "./components/FeedbackButtons";
import ShareCard from "./components/ShareCard";

// ── Constants ────────────────────────────────────────────────────

const DIETS = ["any", "vegetarian", "vegan", "pescatarian"];
const SPICE_LEVELS = ["mild", "medium", "hot"];
const EQUIPMENT_OPTIONS = ["hob", "oven", "microwave", "pan", "wok", "pot"];

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

// ── Page ─────────────────────────────────────────────────────────

export default function Home() {
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
  const [showPantry, setShowPantry] = useState(false);

  // Result
  const [result, setResult] = useState<SuggestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      setError("Add at least one ingredient.");
      return;
    }
    setError("");
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const feedbackSig = makeSignature(ingredients, flavourMode);

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <h1 className="text-3xl font-bold mb-1">SPICE</h1>
      <p className="text-stone-500 mb-6">
        Smart Pantry Intelligence &amp; Culinary Engine
      </p>

      {/* Presets + Challenge */}
      <div className="flex flex-wrap gap-2 mb-6">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => applyPreset(p)}
            className="text-xs px-3 py-1.5 rounded-full border border-stone-300 text-stone-600 hover:bg-stone-100 transition-colors"
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={applyChallenge}
          className="text-xs px-3 py-1.5 rounded-full border border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors"
        >
          Budget Challenge
        </button>
      </div>

      {/* Ingredient input */}
      <section className="mb-6">
        <label className="block font-medium mb-2">Ingredients you have</label>
        <div className="flex gap-2">
          <input
            className="flex-1 border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="e.g. maggi noodles"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addIngredient();
              }
            }}
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
              className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
            >
              {item}
              <button
                onClick={() => removeIngredient(item)}
                className="text-amber-600 hover:text-amber-900 ml-1"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      </section>

      {/* Pantry memory */}
      <section className="mb-6">
        <button
          onClick={() => setShowPantry(!showPantry)}
          className="text-sm text-stone-500 hover:text-stone-800 transition-colors"
        >
          Pantry staples ({pantry.length}){" "}
          <span className="text-xs">{showPantry ? "hide" : "edit"}</span>
        </button>
        {showPantry && (
          <div className="mt-2 p-3 bg-stone-50 rounded-lg border border-stone-200">
            <div className="flex gap-2 mb-2">
              <input
                className="flex-1 border border-stone-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="e.g. oil, salt, soy sauce"
                value={pantryInput}
                onChange={(e) => setPantryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addPantryItem();
                  }
                }}
              />
              <button
                onClick={addPantryItem}
                className="text-sm bg-stone-700 text-white px-3 py-1.5 rounded-lg hover:bg-stone-800 transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {pantry.map((item) => (
                <span
                  key={item}
                  className="bg-stone-200 text-stone-700 px-2 py-0.5 rounded-full text-xs flex items-center gap-1"
                >
                  {item}
                  <button
                    onClick={() => removePantryItem(item)}
                    className="text-stone-500 hover:text-stone-800"
                  >
                    &times;
                  </button>
                </span>
              ))}
              {pantry.length === 0 && (
                <span className="text-xs text-stone-400">
                  No pantry items yet. Add things you always have (oil, salt, etc.)
                </span>
              )}
            </div>
          </div>
        )}
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
                  : "border-stone-300 text-stone-600 hover:bg-stone-100"
              }`}
            >
              {fm.label}
            </button>
          ))}
        </div>
      </section>

      {/* Constraints grid */}
      <section className="mb-6 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Diet</label>
          <select
            value={diet}
            onChange={(e) => setDiet(e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2"
          >
            {DIETS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Time (minutes)</label>
          <input
            type="number"
            min={5}
            max={120}
            value={timeMinutes}
            onChange={(e) => setTimeMinutes(Number(e.target.value))}
            className="w-full border border-stone-300 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Spice level</label>
          <select
            value={spiceLevel}
            onChange={(e) => setSpiceLevel(e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2"
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
                className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                  equipment.includes(eq)
                    ? "bg-stone-800 text-white border-stone-800"
                    : "border-stone-300 text-stone-500"
                }`}
              >
                {eq}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Skill mode toggle */}
      <section className="mb-6 flex items-center gap-3">
        <span className="text-sm text-stone-500">Skill:</span>
        <button
          onClick={() => setSkillMode(skillMode === "beginner" ? "confident" : "beginner")}
          className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
            skillMode === "beginner"
              ? "bg-stone-800 text-white border-stone-800"
              : "border-stone-300 text-stone-600"
          }`}
        >
          Beginner
        </button>
        <button
          onClick={() => setSkillMode(skillMode === "confident" ? "beginner" : "confident")}
          className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
            skillMode === "confident"
              ? "bg-stone-800 text-white border-stone-800"
              : "border-stone-300 text-stone-600"
          }`}
        >
          Confident
        </button>
      </section>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-stone-800 text-white py-3 rounded-lg font-medium hover:bg-stone-900 disabled:opacity-50 mb-8 transition-colors"
      >
        {loading ? "Cooking up ideas..." : "What can I make?"}
      </button>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {/* ── Result ──────────────────────────────────────────────── */}
      {result && (
        <div className="space-y-6">
          {/* Header with badges */}
          <div>
            <h2 className="text-2xl font-bold">{result.title}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-xs bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full">
                ~{result.prep_time_minutes} min
              </span>
              <span className="text-xs bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full">
                {ingredients.length} ingredients
              </span>
              {result.flavour_mode && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  {FLAVOUR_MODES.find((fm) => fm.value === result.flavour_mode)?.label || result.flavour_mode}
                </span>
              )}
            </div>
          </div>

          {/* Pantry used */}
          {result.pantry_used.length > 0 && (
            <p className="text-sm text-stone-500">
              Using pantry staples: {result.pantry_used.join(", ")}
            </p>
          )}

          {/* Minimal rescue */}
          {result.minimal_rescue?.enabled && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="font-medium text-amber-800 mb-2">
                {result.minimal_rescue.rescue_line}
              </p>
              {result.minimal_rescue.flavour_hacks.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-amber-600 uppercase tracking-wide mb-1">Flavour Hacks</p>
                  <ul className="space-y-1">
                    {result.minimal_rescue.flavour_hacks.map((h, i) => (
                      <li key={i} className="text-sm text-amber-700">{h}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.minimal_rescue.ask_for.length > 0 && (
                <p className="text-sm text-amber-700">
                  If you have one more thing: <span className="font-medium">{result.minimal_rescue.ask_for.join(" or ")}</span>
                </p>
              )}
            </div>
          )}

          {/* Cook Mode */}
          <CookMode steps={result.steps} />

          {/* Static steps (visible when cook mode is not started) */}
          <div>
            <h3 className="font-semibold mb-2">Steps</h3>
            <ol className="space-y-2">
              {result.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-amber-600 font-mono text-sm min-w-[3.5rem]">
                    {fmtTime(step.t_seconds)}
                  </span>
                  <div>
                    <span>{step.instruction}</span>
                    {step.tip && (
                      <p className="text-xs text-stone-400 mt-0.5">{step.tip}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Upgrade Ladder */}
          <UpgradeLadderUI ladder={result.upgrade_ladder} />

          {/* Why This Works */}
          <WhyThisWorks reasons={result.why_this_works} />

          {/* Notes */}
          {result.notes.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Notes</h3>
              <ul className="list-disc list-inside space-y-1 text-stone-600 text-sm">
                {result.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Safety */}
          {result.safety.missing_ingredients.length > 0 && (
            <p className="text-sm text-stone-500">
              Assumed available: {result.safety.missing_ingredients.join(", ")}.{" "}
              {result.safety.disclaimer}
            </p>
          )}

          {/* Feedback */}
          <FeedbackButtons signature={feedbackSig} />

          {/* Share */}
          <ShareCard result={result} ingredientCount={ingredients.length} />
        </div>
      )}
    </main>
  );
}
