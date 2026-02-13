"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { SuggestResponse } from "@/lib/types";
import { saveRecipe } from "@/lib/recipes";

interface Props {
  result: SuggestResponse;
  ingredientCount: number;
}

export default function ShareCard({ result, ingredientCount }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardDataUrl, setCardDataUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Generate PNG in background on mount
  useEffect(() => {
    let cancelled = false;
    async function generate() {
      if (!cardRef.current) return;
      try {
        const { toPng } = await import("html-to-image");
        const url = await toPng(cardRef.current, { pixelRatio: 2 });
        if (!cancelled) setCardDataUrl(url);
      } catch {
        // Silently fail — share button will show fallback
      }
    }
    // Small delay to ensure the card is rendered
    const timer = setTimeout(generate, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [result]);

  const handleShare = useCallback(async () => {
    if (!cardDataUrl) return;
    try {
      // Convert data URL to blob
      const res = await fetch(cardDataUrl);
      const blob = await res.blob();
      const file = new File(
        [blob],
        `spice-${result.title.toLowerCase().replace(/\s+/g, "-")}.png`,
        { type: "image/png" }
      );

      // Try native share (mobile)
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: result.title,
          text: `Check out this recipe: ${result.title}`,
          files: [file],
        });
        toast.success("Shared!");
        return;
      }

      // Fallback: download
      const link = document.createElement("a");
      link.download = file.name;
      link.href = cardDataUrl;
      link.click();
      toast.success("Card downloaded!");
    } catch (err) {
      // User cancelled share dialog — not an error
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("Share failed:", err);
      toast.error("Failed to share");
    }
  }, [cardDataUrl, result.title]);

  const handleSave = useCallback(() => {
    saveRecipe(result, ingredientCount);
    setSaved(true);
    toast.success("Recipe saved!");
  }, [result, ingredientCount]);

  return (
    <div>
      {/* Hidden card for export — always dark for branded look */}
      <div className="overflow-hidden h-0">
        <div
          ref={cardRef}
          className="w-[400px] bg-stone-900 text-white p-6 rounded-2xl"
          style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        >
          <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-4">
            SPICE
          </p>
          <h3 className="text-xl font-bold mb-4 leading-tight">{result.title}</h3>
          <div className="flex gap-4 text-sm text-stone-300 mb-4">
            <span>{ingredientCount} ingredients</span>
            <span>&middot;</span>
            <span>~{result.prep_time_minutes} mins</span>
            {result.calories_estimate && (
              <>
                <span>&middot;</span>
                <span>~{result.calories_estimate} cal</span>
              </>
            )}
          </div>
          {result.why_this_works.length > 0 && (
            <p className="text-sm text-stone-400 italic mb-4">
              &ldquo;{result.why_this_works[0]}&rdquo;
            </p>
          )}
          <p className="text-[10px] text-stone-500 mt-2">
            Made with SPICE &middot; Smart Pantry Intelligence &amp; Culinary Engine
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleShare}
          disabled={!cardDataUrl}
          className="p-2 rounded-lg border border-white/10 text-stone-400 dark:text-[rgba(245,245,245,0.5)] hover:text-stone-800 dark:hover:text-[#F5F5F5] hover:border-white/20 transition-colors duration-150 disabled:opacity-30"
          aria-label="Share recipe"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>
        <button
          onClick={handleSave}
          disabled={saved}
          className="p-2 rounded-lg border border-white/10 text-stone-400 dark:text-[rgba(245,245,245,0.5)] hover:text-stone-800 dark:hover:text-[#F5F5F5] hover:border-white/20 transition-colors duration-150 disabled:opacity-30"
          aria-label={saved ? "Recipe saved" : "Save recipe"}
        >
          <svg className="w-4 h-4" fill={saved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
