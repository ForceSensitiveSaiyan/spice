"use client";

import { useState } from "react";

export default function WhyThisWorks({ reasons }: { reasons: string[] }) {
  const [open, setOpen] = useState(false);

  if (reasons.length === 0) return null;

  return (
    <div className="border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-4 py-3 min-h-[44px] text-left hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
      >
        <span className="font-semibold">Why This Works</span>
        <svg
          className={`w-4 h-4 text-stone-400 dark:text-stone-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <ul className="px-4 pb-4 space-y-2">
            {reasons.map((r, i) => (
              <li key={i} className="flex gap-2 text-sm text-stone-600 dark:text-stone-400">
                <span className="text-amber-500 dark:text-amber-400 mt-0.5">&#x2022;</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
