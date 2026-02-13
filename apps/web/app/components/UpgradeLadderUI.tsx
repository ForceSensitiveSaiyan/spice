"use client";

import type { UpgradeLadder, Upgrade } from "@/lib/types";

function UpgradeCard({ upgrade, accent }: { upgrade: Upgrade; accent: string }) {
  return (
    <div className={`border rounded-lg p-3 ${accent}`}>
      <span className="font-medium text-sm">+{upgrade.requires}</span>
      <span className="text-stone-500 dark:text-[rgba(245,245,245,0.5)] text-sm"> &mdash; {upgrade.why}</span>
      <p className="text-xs text-stone-500 dark:text-[rgba(245,245,245,0.4)] mt-1">{upgrade.how}</p>
    </div>
  );
}

export default function UpgradeLadderUI({ ladder }: { ladder: UpgradeLadder }) {
  const hasPantry = ladder.pantry_upgrade.length > 0;
  const hasIfYouHave = ladder.if_you_have.length > 0;
  const hasShop = !!ladder.one_pound_shop;

  if (!hasPantry && !hasIfYouHave && !hasShop) return null;

  return (
    <div className="space-y-3">
      {hasPantry && (
        <div>
          <p className="text-[10px] font-semibold text-stone-400 dark:text-[rgba(245,245,245,0.4)] uppercase tracking-widest mb-1.5">
            Level 1 &middot; Pantry Upgrade
          </p>
          <div className="space-y-2">
            {ladder.pantry_upgrade.map((u, i) => (
              <UpgradeCard key={i} upgrade={u} accent="bg-stone-50 dark:bg-white/5 border-stone-200 dark:border-white/10" />
            ))}
          </div>
        </div>
      )}

      {hasIfYouHave && (
        <div>
          <p className="text-[10px] font-semibold text-stone-400 dark:text-[rgba(245,245,245,0.4)] uppercase tracking-widest mb-1.5">
            Level 2 &middot; If You Have...
          </p>
          <div className="space-y-2">
            {ladder.if_you_have.map((u, i) => (
              <UpgradeCard key={i} upgrade={u} accent="bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-700/30" />
            ))}
          </div>
        </div>
      )}

      {hasShop && (
        <div>
          <p className="text-[10px] font-semibold text-stone-400 dark:text-[rgba(245,245,245,0.4)] uppercase tracking-widest mb-1.5">
            Level 3 &middot; &pound;1 Shop Add-On
          </p>
          <UpgradeCard upgrade={ladder.one_pound_shop!} accent="bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-700/30" />
        </div>
      )}
    </div>
  );
}
