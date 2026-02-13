"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { FeedbackType } from "@/lib/types";
import { saveFeedback } from "@/lib/feedback";

const OPTIONS: { value: FeedbackType; label: string }[] = [
  { value: "too_salty", label: "Too salty" },
  { value: "too_bland", label: "Too bland" },
  { value: "perfect", label: "Perfect" },
  { value: "needs_spice", label: "Needs spice" },
];

interface Props {
  signature: string;
}

export default function FeedbackButtons({ signature }: Props) {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) return null;

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-stone-400 dark:text-[rgba(245,245,245,0.4)] mb-2">How was it?</p>
      <div className="flex gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              saveFeedback(signature, opt.value);
              setSubmitted(true);
              toast.success(`Noted: ${opt.label}. We'll adjust next time.`);
            }}
            className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-stone-500 dark:text-[rgba(245,245,245,0.5)] hover:text-stone-800 dark:hover:text-[#F5F5F5] hover:border-white/20 transition-colors duration-150 whitespace-nowrap"
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
