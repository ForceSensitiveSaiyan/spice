import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`card-elev rounded-xl border border-stone-200/80 dark:border-white/10 bg-surface-card dark:bg-surface-dark-card p-4 sm:p-5 ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-widest text-stone-500 dark:text-[rgba(245,245,245,0.65)] mb-3">
      {children}
    </h3>
  );
}
