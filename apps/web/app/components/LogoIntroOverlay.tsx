"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";

interface Props {
  open: boolean;
  targetRef: React.RefObject<HTMLElement | null>;
  onComplete: () => void;
}

const WORDMARK_IN_MS = 240;
const HOLD_MS = 380;
const FLY_MS = 700;
const OUT_MS = 220;
const TOTAL_MS = WORDMARK_IN_MS + HOLD_MS + FLY_MS + OUT_MS;

export default function LogoIntroOverlay({ open, targetRef, onComplete }: Props) {
  const overlayIRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [shouldRender, setShouldRender] = useState(open);
  const [dx, setDx] = useState(0);
  const [dy, setDy] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [skipRequested, setSkipRequested] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(media.matches);
    function onChange(e: MediaQueryListEvent) {
      setReducedMotion(e.matches);
    }
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    const overlayI = overlayIRef.current;
    const target = targetRef.current;
    if (!overlayI || !target) {
      setDx(0);
      setDy(0);
      return;
    }
    const overlayRect = overlayI.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const overlayCenterX = overlayRect.left + overlayRect.width / 2;
    const overlayCenterY = overlayRect.top + overlayRect.height / 2;
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;
    setDx(targetCenterX - overlayCenterX);
    setDy(targetCenterY - overlayCenterY);
  }, [open, targetRef]);

  useEffect(() => {
    if (!open) {
      setShouldRender(false);
      setSkipRequested(false);
      return;
    }
    setShouldRender(true);
    if (timerRef.current) clearTimeout(timerRef.current);

    const duration = reducedMotion ? 320 : TOTAL_MS;
    timerRef.current = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [open, reducedMotion, onComplete]);

  if (!shouldRender) return null;

  const overlayFadeDelay = skipRequested || reducedMotion ? 0 : WORDMARK_IN_MS + HOLD_MS + FLY_MS - 120;
  const overlayFadeDuration = reducedMotion || skipRequested ? 160 : OUT_MS;
  const flyDelay = reducedMotion || skipRequested ? 0 : WORDMARK_IN_MS + HOLD_MS;
  const flyDuration = reducedMotion || skipRequested ? 0 : FLY_MS;
  const wordmarkOutDelay = skipRequested || reducedMotion ? 0 : WORDMARK_IN_MS + HOLD_MS + FLY_MS - 140;
  const wordmarkOutDuration = reducedMotion || skipRequested ? 160 : OUT_MS;

  function handleSkip() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSkipRequested(true);
    const duration = reducedMotion ? 160 : OUT_MS;
    timerRef.current = setTimeout(() => {
      onComplete();
    }, duration);
  }

  return (
    <div
      className="fixed inset-0 z-50"
      onClick={handleSkip}
      aria-hidden
      data-testid="intro-overlay"
    >
      <div
        className="absolute inset-0 bg-gradient-to-b from-amber-50/90 via-white/90 to-amber-100/90 dark:from-[#0f0f0f]/95 dark:via-[#111111]/95 dark:to-[#1b140a]/95"
        style={{
          animation: `intro-overlay-out ${overlayFadeDuration}ms ease-out ${overlayFadeDelay}ms forwards`,
        }}
      />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-4xl sm:text-5xl font-bold tracking-tight text-[#111111] dark:text-[#F5F5F5]">
          <span
            className="inline-block"
            style={{
              animation: [
                `intro-wordmark-in ${reducedMotion ? 120 : WORDMARK_IN_MS}ms ease-out both`,
                `intro-wordmark-out ${wordmarkOutDuration}ms ease-in ${wordmarkOutDelay}ms forwards`,
              ].join(", "),
            }}
          >
            SP
            <span
              ref={overlayIRef}
              className="inline-block text-amber-600 dark:text-amber-400"
              style={{
                ...(reducedMotion
                  ? {}
                  : {
                      "--intro-dx": `${dx}px`,
                      "--intro-dy": `${dy}px`,
                      animation: `intro-fly ${flyDuration}ms ease-out ${flyDelay}ms forwards`,
                    }),
              } as CSSProperties}
            >
              I
            </span>
            CE
          </span>
        </div>
      </div>
    </div>
  );
}
