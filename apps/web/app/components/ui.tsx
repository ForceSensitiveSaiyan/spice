import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-white/10 bg-white dark:bg-surface-dark-card p-4 sm:p-5 ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-widest text-stone-400 dark:text-[rgba(245,245,245,0.5)] mb-3">
      {children}
    </h3>
  );
}
