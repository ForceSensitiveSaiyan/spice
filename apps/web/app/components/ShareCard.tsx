"use client";

import { useRef, useCallback } from "react";
import { toast } from "sonner";
import type { SuggestResponse } from "@/lib/types";

interface Props {
  result: SuggestResponse;
  ingredientCount: number;
}

export default function ShareCard({ result, ingredientCount }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleShare = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      // Dynamic import to keep bundle light
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `spice-${result.title.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Card downloaded!");
    } catch (err) {
      console.error("Share card export failed:", err);
      toast.error("Failed to export share card");
    }
  }, [result.title]);

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

      <button
        onClick={handleShare}
        className="w-full border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 py-2.5 rounded-lg font-medium hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
      >
        Share Card (download PNG)
      </button>
    </div>
  );
}
