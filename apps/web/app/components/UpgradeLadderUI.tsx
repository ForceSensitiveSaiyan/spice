"use client";

import type { UpgradeLadder, Upgrade } from "@/lib/types";

function UpgradeCard({ upgrade, tint }: { upgrade: Upgrade; tint: string }) {
  return (
    <div className={`border rounded-lg p-3 ${tint}`}>
      <span className="font-medium text-sm">+{upgrade.requires}</span>
      <span className="text-stone-600 dark:text-[rgba(245,245,245,0.7)] text-sm"> &mdash; {upgrade.why}</span>
      <p className="text-xs text-stone-500 dark:text-[rgba(245,245,245,0.6)] mt-1">{upgrade.how}</p>
    </div>
  );
}

function LevelLabel({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span className="grid place-items-center w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold leading-none">
        {n}
      </span>
      <span className="text-[10px] font-semibold text-stone-500 dark:text-[rgba(245,245,245,0.6)] uppercase tracking-widest">
        {children}
      </span>
    </div>
  );
}

// One coherent language: escalating amber intensity, subtle → strong.
const TINT_1 = "bg-amber-50/60 dark:bg-amber-500/[0.06] border-amber-200/60 dark:border-amber-500/15";
const TINT_2 = "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/25";
const TINT_3 = "bg-amber-100/70 dark:bg-amber-500/[0.16] border-amber-300 dark:border-amber-500/40";

export default function UpgradeLadderUI({ ladder }: { ladder: UpgradeLadder }) {
  const hasPantry = ladder.pantry_upgrade.length > 0;
  const hasIfYouHave = ladder.if_you_have.length > 0;
  const hasShop = !!ladder.one_pound_shop;

  if (!hasPantry && !hasIfYouHave && !hasShop) return null;

  return (
    <div className="space-y-3">
      {hasPantry && (
        <div>
          <LevelLabel n={1}>Pantry Upgrade</LevelLabel>
          <div className="space-y-2">
            {ladder.pantry_upgrade.map((u, i) => (
              <UpgradeCard key={i} upgrade={u} tint={TINT_1} />
            ))}
          </div>
        </div>
      )}

      {hasIfYouHave && (
        <div>
          <LevelLabel n={2}>If You Have&hellip;</LevelLabel>
          <div className="space-y-2">
            {ladder.if_you_have.map((u, i) => (
              <UpgradeCard key={i} upgrade={u} tint={TINT_2} />
            ))}
          </div>
        </div>
      )}

      {hasShop && (
        <div>
          <LevelLabel n={3}>&pound;1 Shop Add-On</LevelLabel>
          <UpgradeCard upgrade={ladder.one_pound_shop!} tint={TINT_3} />
        </div>
      )}
    </div>
  );
}
