"use client";

import { useState } from "react";
import { archiveIntentType, upsertIntentType } from "@/lib/actions";

type Intent = {
  id: string;
  name: string;
  colorHex: string;
  sortOrder: number;
  archived: boolean;
  isDefault: boolean;
};

export function IntentSettings({ initialIntents }: { initialIntents: Intent[] }) {
  const [intents, setIntents] = useState(
    initialIntents.filter((i) => !i.archived),
  );
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366F1");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="max-w-lg space-y-6">
      <ul className="space-y-2">
        {intents.map((i) => (
          <li
            key={i.id}
            className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: i.colorHex }}
              />
              <span>{i.name}</span>
              {i.isDefault && (
                <span className="text-xs text-[var(--muted)]">default</span>
              )}
            </div>
            {i.name !== "Uncategorized" && (
              <button
                type="button"
                className="text-xs text-[var(--muted)] hover:text-red-600"
                onClick={async () => {
                  const res = await archiveIntentType({ id: i.id });
                  if ("ok" in res) {
                    setIntents((list) => list.filter((x) => x.id !== i.id));
                  } else if ("error" in res) setError(res.error);
                }}
              >
                Archive
              </button>
            )}
          </li>
        ))}
      </ul>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <h2 className="font-semibold">Add intent</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <input
            className="flex-1 rounded-lg border border-[var(--border)] px-3 py-2"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-14 cursor-pointer rounded border border-[var(--border)]"
          />
          <button
            type="button"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm text-white"
            onClick={async () => {
              const res = await upsertIntentType({
                name,
                colorHex: color,
              });
              if ("intent" in res) {
                setIntents((list) => [...list, { ...res.intent, isDefault: false }]);
                setName("");
                setError(null);
              } else if ("error" in res) setError(res.error);
            }}
          >
            Add
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
