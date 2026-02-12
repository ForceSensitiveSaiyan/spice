"use client";

import { useState } from "react";

export default function WhyThisWorks({ reasons }: { reasons: string[] }) {
  const [open, setOpen] = useState(false);

  if (reasons.length === 0) return null;

  return (
    <div className="border border-stone-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-stone-50 transition-colors"
      >
        <span className="font-semibold">Why This Works</span>
        <span className="text-stone-400 text-sm">{open ? "collapse" : "expand"}</span>
      </button>
      {open && (
        <ul className="px-4 pb-4 space-y-2">
          {reasons.map((r, i) => (
            <li key={i} className="flex gap-2 text-sm text-stone-600">
              <span className="text-amber-500 mt-0.5">&#x2022;</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
