"use client";

import { useState } from "react";
import { fetchSuggestion } from "@/lib/api";
import type { SuggestResponse } from "@/lib/types";

const DIETS = ["any", "vegetarian", "vegan", "pescatarian"];
const SPICE_LEVELS = ["mild", "medium", "hot"];
const EQUIPMENT_OPTIONS = ["hob", "oven", "microwave", "pan", "wok", "pot"];

export default function Home() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [diet, setDiet] = useState("any");
  const [timeMinutes, setTimeMinutes] = useState(30);
  const [equipment, setEquipment] = useState<string[]>(["hob", "pan"]);
  const [spiceLevel, setSpiceLevel] = useState("medium");
  const [result, setResult] = useState<SuggestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function addIngredient() {
    const trimmed = input.trim().toLowerCase();
    if (trimmed && !ingredients.includes(trimmed)) {
      setIngredients([...ingredients, trimmed]);
    }
    setInput("");
  }

  function removeIngredient(item: string) {
    setIngredients(ingredients.filter((i) => i !== item));
  }

  function toggleEquipment(item: string) {
    setEquipment((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]
    );
  }

  async function handleSubmit() {
    if (ingredients.length === 0) {
      setError("Add at least one ingredient.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const res = await fetchSuggestion({
        ingredients,
        constraints: {
          diet: diet === "any" ? undefined : diet,
          time_minutes: timeMinutes,
          equipment,
          spice_level: spiceLevel,
        },
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-1">SPICE</h1>
      <p className="text-stone-500 mb-8">
        Smart Pantry Intelligence &amp; Culinary Engine
      </p>

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
            onClick={addIngredient}
            className="bg-amber-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-600"
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

      {/* Constraints */}
      <section className="mb-6 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Diet</label>
          <select
            value={diet}
            onChange={(e) => setDiet(e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2"
          >
            {DIETS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Time (minutes)
          </label>
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
              <option key={s} value={s}>
                {s}
              </option>
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
                className={`text-xs px-2 py-1 rounded-full border ${
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

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-stone-800 text-white py-3 rounded-lg font-medium hover:bg-stone-900 disabled:opacity-50 mb-8"
      >
        {loading ? "Cooking up ideas..." : "What can I make?"}
      </button>

      {error && (
        <p className="text-red-600 mb-4">{error}</p>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">{result.title}</h2>
            <p className="text-stone-500">
              ~{result.prep_time_minutes} minutes
            </p>
          </div>

          {/* Steps */}
          <div>
            <h3 className="font-semibold mb-2">Steps</h3>
            <ol className="space-y-2">
              {result.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-amber-600 font-mono text-sm min-w-[3rem]">
                    t={step.t}m
                  </span>
                  <span>{step.instruction}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Upgrades */}
          {result.upgrades.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Upgrades (if you have...)</h3>
              <ul className="space-y-2">
                {result.upgrades.map((u, i) => (
                  <li
                    key={i}
                    className="bg-amber-50 border border-amber-200 rounded-lg p-3"
                  >
                    <span className="font-medium text-amber-700">
                      +{u.requires}
                    </span>{" "}
                    &mdash; {u.why}
                    <p className="text-sm text-stone-600 mt-1">{u.how}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cheap addition */}
          {result.one_cheapest_addition && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <h3 className="font-semibold mb-1">If you can buy one thing...</h3>
              <p>
                <span className="font-medium text-green-700">
                  {result.one_cheapest_addition.item}
                </span>{" "}
                &mdash; {result.one_cheapest_addition.why}
              </p>
              <p className="text-sm text-stone-500">
                {result.one_cheapest_addition.cost_note}
              </p>
            </div>
          )}

          {/* Notes */}
          {result.notes.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Notes</h3>
              <ul className="list-disc list-inside space-y-1 text-stone-600">
                {result.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Safety */}
          {result.safety.missing_ingredients.length > 0 && (
            <p className="text-sm text-stone-500">
              Assumed available:{" "}
              {result.safety.missing_ingredients.join(", ")}. {result.safety.disclaimer}
            </p>
          )}
        </div>
      )}
    </main>
  );
}
