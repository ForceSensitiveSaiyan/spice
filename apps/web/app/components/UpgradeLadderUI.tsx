"use client";

import type { UpgradeLadder, Upgrade } from "@/lib/types";

function UpgradeCard({ upgrade, accent }: { upgrade: Upgrade; accent: string }) {
  return (
    <div className={`border rounded-lg p-3 ${accent}`}>
      <span className="font-medium">+{upgrade.requires}</span>
      <span className="text-stone-500"> &mdash; {upgrade.why}</span>
      <p className="text-sm text-stone-600 mt-1">{upgrade.how}</p>
    </div>
  );
}

export default function UpgradeLadderUI({ ladder }: { ladder: UpgradeLadder }) {
  const hasPantry = ladder.pantry_upgrade.length > 0;
  const hasIfYouHave = ladder.if_you_have.length > 0;
  const hasShop = !!ladder.one_pound_shop;

  if (!hasPantry && !hasIfYouHave && !hasShop) return null;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Upgrade Ladder</h3>

      {hasPantry && (
        <div>
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">
            Level 1 &middot; Pantry Upgrade
          </p>
          <div className="space-y-2">
            {ladder.pantry_upgrade.map((u, i) => (
              <UpgradeCard key={i} upgrade={u} accent="bg-stone-50 border-stone-200" />
            ))}
          </div>
        </div>
      )}

      {hasIfYouHave && (
        <div>
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">
            Level 2 &middot; If You Have...
          </p>
          <div className="space-y-2">
            {ladder.if_you_have.map((u, i) => (
              <UpgradeCard key={i} upgrade={u} accent="bg-amber-50 border-amber-200" />
            ))}
          </div>
        </div>
      )}

      {hasShop && (
        <div>
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">
            Level 3 &middot; &pound;1 Shop Add-On
          </p>
          <UpgradeCard upgrade={ladder.one_pound_shop!} accent="bg-green-50 border-green-200" />
        </div>
      )}
    </div>
  );
}
