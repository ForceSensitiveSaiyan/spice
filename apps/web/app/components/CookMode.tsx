"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Step } from "@/lib/types";

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function playDing() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 800;
    gain.gain.value = 0.3;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // Audio not available — silently ignore
  }
}

interface CookModeProps {
  steps: Step[];
  active: boolean;
  onActiveChange: (active: boolean) => void;
}

export default function CookMode({ steps, active, onActiveChange }: CookModeProps) {
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [largeText, setLargeText] = useState(false);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevStepIdx = useRef(0);

  const totalTime = steps.length > 0 ? steps[steps.length - 1].t_seconds + 60 : 0;

  // Load large text preference
  useEffect(() => {
    setLargeText(localStorage.getItem("spice-large-text") === "true");
  }, []);

  const stop = useCallback(() => {
    if (interval.current) clearInterval(interval.current);
    interval.current = null;
  }, []);

  // Reset state when cook mode is activated
  useEffect(() => {
    if (active) {
      setElapsed(0);
      setPaused(false);
      prevStepIdx.current = 0;
    }
  }, [active]);

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

  // Play ding on step change
  useEffect(() => {
    if (active && !muted && currentIdx !== prevStepIdx.current) {
      playDing();
    }
    prevStepIdx.current = currentIdx;
  }, [currentIdx, active, muted]);

  function skipToNextStep() {
    if (currentIdx < steps.length - 1) {
      setElapsed(steps[currentIdx + 1].t_seconds);
    }
  }

  function toggleLargeText() {
    const next = !largeText;
    setLargeText(next);
    localStorage.setItem("spice-large-text", String(next));
  }

  const textSize = largeText ? "text-base sm:text-lg" : "text-sm";

  if (!active) {
    return (
      <button
        onClick={() => onActiveChange(true)}
        className="w-full border border-dashed border-amber-400/50 dark:border-amber-500/40 text-amber-700 dark:text-amber-400 py-3 rounded-lg text-sm font-medium hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors duration-150"
      >
        Start Cooking Mode
      </button>
    );
  }

  const done = elapsed >= totalTime;

  return (
    <div className="border border-stone-200 dark:border-white/10 rounded-xl p-4 bg-white dark:bg-surface-dark-card">
      {/* Timer header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <span role="timer" aria-label={`Elapsed time: ${fmtTime(elapsed)}`} className="text-2xl font-mono font-bold text-amber-600 dark:text-amber-400">
            {fmtTime(elapsed)}
          </span>
          <span className="text-sm text-stone-400 dark:text-stone-500">/ {fmtTime(totalTime)}</span>
          <span className="text-xs text-stone-400 dark:text-stone-500 font-medium">
            Step {currentIdx + 1}/{steps.length}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Audio toggle */}
          <button
            onClick={() => setMuted(!muted)}
            aria-label={muted ? "Unmute step notifications" : "Mute step notifications"}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-white/10 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors duration-150 min-h-[36px]"
          >
            {muted ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
          </button>
          {/* Large text toggle */}
          <button
            onClick={toggleLargeText}
            aria-label={largeText ? "Normal text size" : "Large text size"}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-white/10 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors duration-150 min-h-[36px] font-bold"
          >
            {largeText ? "A" : "A+"}
          </button>
          {/* Skip */}
          {!done && currentIdx < steps.length - 1 && (
            <button
              onClick={skipToNextStep}
              className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 dark:border-white/10 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors duration-150 min-h-[36px]"
            >
              Skip
            </button>
          )}
          {!done && (
            <button
              onClick={() => setPaused(!paused)}
              className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 dark:border-white/10 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors duration-150 min-h-[36px]"
            >
              {paused ? "Resume" : "Pause"}
            </button>
          )}
          <button
            onClick={() => {
              stop();
              onActiveChange(false);
              setElapsed(0);
              setPaused(false);
            }}
            className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 dark:border-white/10 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors duration-150 min-h-[36px]"
          >
            Stop
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-stone-100 dark:bg-white/10 rounded-full mb-4 overflow-hidden">
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
              <span className={`font-mono min-w-[3.5rem] text-amber-600 dark:text-amber-400 pt-0.5 ${textSize}`}>
                {fmtTime(step.t_seconds)}
              </span>
              <div className="flex-1">
                <span className={`${isCurrent ? "font-medium" : ""} ${textSize}`}>
                  {step.instruction}
                </span>
                {step.tip && (
                  <p className={`text-stone-400 dark:text-stone-500 mt-0.5 ${largeText ? "text-sm" : "text-xs"}`}>{step.tip}</p>
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
