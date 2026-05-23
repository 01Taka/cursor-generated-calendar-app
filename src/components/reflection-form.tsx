"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveDayReflection } from "@/lib/actions";

export function ReflectionForm({
  date,
  blocks,
  initialNote,
  initialCarry,
  tomorrowDate,
}: {
  date: string;
  blocks: {
    id: string;
    title: string;
    colorHex: string;
    startAt: string;
    endAt: string;
  }[];
  initialNote: string;
  initialCarry: string[];
  tomorrowDate: string;
}) {
  const router = useRouter();
  const [note, setNote] = useState(initialNote);
  const [carry, setCarry] = useState<Set<string>>(new Set(initialCarry));
  const [saving, setSaving] = useState(false);

  return (
    <div className="max-w-2xl space-y-6">
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <h2 className="font-semibold">Today&apos;s blocks</h2>
        <ul className="mt-3 space-y-2">
          {blocks.length === 0 && (
            <p className="text-sm text-[var(--muted)]">No blocks recorded.</p>
          )}
          {blocks.map((b) => (
            <li key={b.id} className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={carry.has(b.id)}
                onChange={(e) => {
                  const next = new Set(carry);
                  if (e.target.checked) next.add(b.id);
                  else next.delete(b.id);
                  setCarry(next);
                }}
              />
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: b.colorHex }}
              />
              <span>{b.title}</span>
            </li>
          ))}
        </ul>
      </section>

      <label className="block">
        <span className="font-semibold">Reflection note</span>
        <textarea
          className="mt-2 min-h-[120px] w-full rounded-xl border border-[var(--border)] bg-[var(--card)] p-3"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={2000}
          placeholder="What felt meaningful today?"
        />
      </label>

      <div className="flex gap-3">
        <button
          type="button"
          disabled={saving}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
          onClick={async () => {
            setSaving(true);
            const res = await saveDayReflection({
              date,
              note,
              carryBlockIds: [...carry],
            });
            setSaving(false);
            if ("tomorrowDate" in res) {
              router.push(`/day/${res.tomorrowDate}`);
            }
          }}
        >
          {saving ? "Saving…" : "Save & open tomorrow"}
        </button>
        <Link
          href={`/day/${date}`}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm"
        >
          Back to day
        </Link>
        <Link
          href={`/day/${tomorrowDate}`}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)]"
        >
          Preview tomorrow
        </Link>
      </div>
    </div>
  );
}
