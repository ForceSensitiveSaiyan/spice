"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Step } from "@/lib/types";

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function CookMode({ steps }: { steps: Step[] }) {
  const [active, setActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalTime = steps.length > 0 ? steps[steps.length - 1].t_seconds + 60 : 0;

  const stop = useCallback(() => {
    if (interval.current) clearInterval(interval.current);
    interval.current = null;
  }, []);

  useEffect(() => {
    if (active && !paused) {
      interval.current = setInterval(() => {
        setElapsed((e) => {
          if (e >= totalTime) {
            stop();
            return e;
          }
          return e + 1;
        });
      }, 1000);
    } else {
      stop();
    }
    return stop;
  }, [active, paused, totalTime, stop]);

  // Find current step index
  let currentIdx = 0;
  for (let i = steps.length - 1; i >= 0; i--) {
    if (elapsed >= steps[i].t_seconds) {
      currentIdx = i;
      break;
    }
  }

  if (!active) {
    return (
      <button
        onClick={() => setActive(true)}
        className="w-full border-2 border-dashed border-amber-400 dark:border-amber-500 text-amber-700 dark:text-amber-400 py-3 rounded-lg font-medium hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
      >
        Start Cooking Mode
      </button>
    );
  }

  const done = elapsed >= totalTime;

  return (
    <div className="border border-stone-200 dark:border-stone-700 rounded-xl p-4 bg-white dark:bg-surface-dark-card">
      {/* Timer header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <span role="timer" aria-label={`Elapsed time: ${fmtTime(elapsed)}`} className="text-2xl font-mono font-bold text-amber-600 dark:text-amber-400">
            {fmtTime(elapsed)}
          </span>
          <span className="text-sm text-stone-400 dark:text-stone-500">/ {fmtTime(totalTime)}</span>
        </div>
        <div className="flex gap-2">
          {!done && (
            <button
              onClick={() => setPaused(!paused)}
              className="text-sm px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-700 min-h-[36px]"
            >
              {paused ? "Resume" : "Pause"}
            </button>
          )}
          <button
            onClick={() => {
              stop();
              setActive(false);
              setElapsed(0);
              setPaused(false);
            }}
            className="text-sm px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-700 min-h-[36px]"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-stone-100 dark:bg-stone-700 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-amber-500 rounded-full transition-all duration-1000"
          style={{ width: `${Math.min((elapsed / totalTime) * 100, 100)}%` }}
        />
      </div>

      {/* Steps timeline */}
      <ol className="space-y-3">
        {steps.map((step, i) => {
          const isCurrent = i === currentIdx && !done;
          const isPast = elapsed > step.t_seconds && !isCurrent;
          return (
            <li
              key={i}
              className={`flex gap-3 p-2 rounded-lg transition-colors ${
                isCurrent
                  ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700"
                  : isPast
                  ? "opacity-50"
                  : ""
              }`}
            >
              <span className="font-mono text-sm min-w-[3.5rem] text-amber-600 dark:text-amber-400 pt-0.5">
                {fmtTime(step.t_seconds)}
              </span>
              <div className="flex-1">
                <span className={isCurrent ? "font-medium" : ""}>
                  {step.instruction}
                </span>
                {step.tip && (
                  <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{step.tip}</p>
                )}
              </div>
              {isCurrent && (
                <span className="text-amber-500 dark:text-amber-400 text-xs font-medium self-center">
                  NOW
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {done && (
        <p className="text-center text-green-600 dark:text-green-400 font-medium mt-4">
          Done! Time to eat.
        </p>
      )}
    </div>
  );
}
