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
      <p className="text-sm text-stone-500 dark:text-stone-400 mb-2">How was it?</p>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              saveFeedback(signature, opt.value);
              setSubmitted(true);
              toast.success(`Noted: ${opt.label}. We'll adjust next time.`);
            }}
            className="text-sm px-3 py-1.5 rounded-full border border-stone-300 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
