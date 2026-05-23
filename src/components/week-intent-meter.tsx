import type { IntentType } from "@prisma/client";
import type { BudgetRow } from "@/lib/week-summary";

export function WeekIntentMeter({
  budgets,
  intents,
}: {
  budgets: BudgetRow[];
  intents: IntentType[];
}) {
  const intentMap = new Map(intents.map((i) => [i.id, i]));

  return (
    <ul className="space-y-2">
      {budgets
        .filter((b) => b.targetHours > 0 || b.actualHours > 0)
        .slice(0, 4)
        .map((b) => {
          const intent = intentMap.get(b.intentTypeId);
          const pct =
            b.targetHours > 0
              ? Math.min(100, (b.actualHours / b.targetHours) * 100)
              : b.actualHours > 0
                ? 100
                : 0;
          return (
            <li key={b.intentTypeId}>
              <div className="mb-1 flex justify-between text-xs">
                <span>{intent?.name ?? "—"}</span>
                <span className="text-[var(--muted)]">
                  {b.actualHours.toFixed(1)}h / {b.targetHours.toFixed(1)}h
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface)]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: intent?.colorHex ?? "#9CA3AF",
                  }}
                />
              </div>
            </li>
          );
        })}
    </ul>
  );
}
