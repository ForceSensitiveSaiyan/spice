export default function WhyThisWorks({ reasons }: { reasons: string[] }) {
  if (reasons.length === 0) return null;

  return (
    <div className="border border-stone-200 dark:border-stone-700 rounded-lg p-4">
      <h3 className="font-semibold mb-3">Why This Works</h3>
      <ul className="space-y-2">
        {reasons.map((r, i) => (
          <li key={i} className="flex gap-2 text-sm text-stone-600 dark:text-stone-400">
            <span className="text-amber-500 dark:text-amber-400 mt-0.5">&#x2022;</span>
            <span>{r}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
