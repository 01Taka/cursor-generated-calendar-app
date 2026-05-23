"use client";

import Link from "next/link";
import { useState } from "react";
import { saveWeeklyIntentBudgets } from "@/lib/actions";

type Budget = {
  intentTypeId: string;
  targetHours: number;
  actualHours: number;
};

export function WeekView({
  weekStart,
  days,
  intents,
  initialBudgets,
}: {
  weekStart: string;
  days: {
    date: string;
    blocks: {
      id: string;
      title: string;
      colorHex: string;
      startAt: string;
      endAt: string;
    }[];
  }[];
  intents: { id: string; name: string; colorHex: string }[];
  initialBudgets: Budget[];
}) {
  const [budgets, setBudgets] = useState(initialBudgets);
  const [targets, setTargets] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      initialBudgets.map((b) => [b.intentTypeId, b.targetHours]),
    ),
  );
  const [saved, setSaved] = useState(false);

  const intentMap = new Map(intents.map((i) => [i.id, i]));

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-7">
        {days.map((day) => (
          <Link
            key={day.date}
            href={`/day/${day.date}`}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 hover:border-[var(--accent)]"
          >
            <p className="text-xs font-medium text-[var(--muted)]">{day.date}</p>
            <ul className="mt-2 space-y-1">
              {day.blocks.slice(0, 4).map((b) => (
                <li
                  key={b.id}
                  className="truncate rounded px-1 text-xs text-white"
                  style={{ backgroundColor: b.colorHex }}
                >
                  {b.title}
                </li>
              ))}
              {day.blocks.length > 4 && (
                <li className="text-xs text-[var(--muted)]">
                  +{day.blocks.length - 4} more
                </li>
              )}
            </ul>
          </Link>
        ))}
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-semibold">Intent budgets</h2>
        <p className="text-sm text-[var(--muted)]">Week of {weekStart}</p>
        <ul className="mt-4 space-y-4">
          {intents.map((intent) => {
            const row = budgets.find((b) => b.intentTypeId === intent.id);
            const actual = row?.actualHours ?? 0;
            const target = targets[intent.id] ?? 0;
            return (
              <li key={intent.id} className="flex flex-wrap items-center gap-4">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: intent.colorHex }}
                />
                <span className="w-28 font-medium">{intent.name}</span>
                <input
                  type="number"
                  min={0}
                  max={168}
                  step={0.5}
                  className="w-24 rounded-lg border border-[var(--border)] px-2 py-1"
                  value={target}
                  onChange={(e) =>
                    setTargets((t) => ({
                      ...t,
                      [intent.id]: Number(e.target.value),
                    }))
                  }
                />
                <span className="text-sm text-[var(--muted)]">
                  target h · actual {actual.toFixed(1)}h
                </span>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
          onClick={async () => {
            const res = await saveWeeklyIntentBudgets({
              weekStart,
              targets: intents.map((i) => ({
                intentTypeId: i.id,
                targetHours: targets[i.id] ?? 0,
              })),
            });
            if ("budgets" in res) {
              setBudgets(res.budgets);
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);
            }
          }}
        >
          {saved ? "Saved!" : "Save budgets"}
        </button>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Distribution</h2>
        <div className="flex h-8 overflow-hidden rounded-lg">
          {budgets
            .filter((b) => b.actualHours > 0)
            .map((b) => {
              const intent = intentMap.get(b.intentTypeId);
              const total = budgets.reduce((s, x) => s + x.actualHours, 0);
              const width = total > 0 ? (b.actualHours / total) * 100 : 0;
              return (
                <div
                  key={b.intentTypeId}
                  title={`${intent?.name}: ${b.actualHours.toFixed(1)}h`}
                  style={{
                    width: `${width}%`,
                    backgroundColor: intent?.colorHex,
                  }}
                />
              );
            })}
        </div>
      </section>
    </div>
  );
}
