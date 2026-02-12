"use client";

import { useState, useEffect } from "react";

const LOADING_MESSAGES = [
  "Blooming spices...",
  "Deglazing the pan of destiny...",
  "Consulting the wok gods...",
  "Reducing broth to glossy perfection...",
  "Trust the process. Salt at the end.",
  "Toasting aromatics...",
  "Building layers of flavour...",
  "Caramelising onions with patience...",
  "Seasoning with intent...",
  "Letting the Maillard reaction do its thing...",
  "Balancing acid and fat...",
  "Tempering spices in hot oil...",
  "Folding in the good stuff...",
  "Simmering low and slow...",
  "Tasting. Adjusting. Perfecting.",
];

function Pulse({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-stone-200 dark:bg-stone-700 ${className ?? ""}`}
    />
  );
}

export default function SkeletonLoader() {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div role="status" className="space-y-6 py-2">
      {/* Fun loading message */}
      <p
        key={msgIdx}
        className="text-center text-amber-600 dark:text-amber-400 font-medium animate-fade-in-up"
      >
        {LOADING_MESSAGES[msgIdx]}
      </p>

      {/* Title */}
      <div>
        <Pulse className="h-7 w-2/3 mb-3" />
        <div className="flex gap-2">
          <Pulse className="h-5 w-16 rounded-full" />
          <Pulse className="h-5 w-20 rounded-full" />
          <Pulse className="h-5 w-24 rounded-full" />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        <Pulse className="h-5 w-16 mb-2" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-3">
            <Pulse className="h-4 w-12" />
            <Pulse className="h-4 flex-1" />
          </div>
        ))}
      </div>

      {/* Upgrade ladder */}
      <div className="space-y-3">
        <Pulse className="h-5 w-32 mb-2" />
        <Pulse className="h-16 w-full rounded-lg" />
        <Pulse className="h-16 w-full rounded-lg" />
      </div>

      {/* Why this works */}
      <Pulse className="h-12 w-full rounded-lg" />

      <span className="sr-only">Loading meal suggestion...</span>
    </div>
  );
}
