"use client";

import { useState } from "react";
import type { BlockView } from "@/stores/day-store";

export function BlockEditor({
  block,
  intents,
  onClose,
  onSave,
  onDelete,
}: {
  block: BlockView;
  intents: { id: string; name: string; colorHex: string }[];
  onClose: () => void;
  onSave: (data: {
    id: string;
    title: string;
    intentTypeId: string;
    startAt: string;
    endAt: string;
  }) => Promise<void>;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(block.title);
  const [intentTypeId, setIntentTypeId] = useState(block.intentTypeId);
  const [startAt, setStartAt] = useState(block.startAt.slice(0, 16));
  const [endAt, setEndAt] = useState(block.endAt.slice(0, 16));
  const [saving, setSaving] = useState(false);

  return (
    <aside className="w-80 shrink-0 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">Edit block</h2>
        <button type="button" onClick={onClose} className="text-sm text-[var(--muted)]">
          Close
        </button>
      </div>
      <label className="mb-3 block text-sm">
        Title
        <input
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <label className="mb-3 block text-sm">
        Intent
        <select
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
          value={intentTypeId}
          onChange={(e) => setIntentTypeId(e.target.value)}
        >
          {intents.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
      </label>
      <label className="mb-3 block text-sm">
        Start
        <input
          type="datetime-local"
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
          value={startAt}
          onChange={(e) => setStartAt(e.target.value)}
        />
      </label>
      <label className="mb-4 block text-sm">
        End
        <input
          type="datetime-local"
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
          value={endAt}
          onChange={(e) => setEndAt(e.target.value)}
        />
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={saving}
          className="flex-1 rounded-lg bg-[var(--accent)] py-2 text-sm font-medium text-white"
          onClick={async () => {
            setSaving(true);
            await onSave({
              id: block.id,
              title,
              intentTypeId,
              startAt: new Date(startAt).toISOString(),
              endAt: new Date(endAt).toISOString(),
            });
            setSaving(false);
          }}
        >
          Save
        </button>
        <button
          type="button"
          className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600"
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </aside>
  );
}
