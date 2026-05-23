"use client";

import { useCallback, useEffect, useState } from "react";
import { parseISO } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import {
  TIMELINE_END_HOUR,
  TIMELINE_START_HOUR,
} from "@/lib/dates";
import { deleteTimeBlock, upsertTimeBlock } from "@/lib/actions";
import { useDayStore, type BlockView } from "@/stores/day-store";
import { cn } from "@/lib/utils";
import { BlockEditor } from "@/components/block-editor";

const HOUR_HEIGHT = 56;
const TOTAL_HOURS = TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1;

function minutesFromTimelineStart(date: Date, timezone: string) {
  const z = toZonedTime(date, timezone);
  return (z.getHours() - TIMELINE_START_HOUR) * 60 + z.getMinutes();
}

function dateFromMinutes(
  dateStr: string,
  minutes: number,
  timezone: string,
): Date {
  const h = TIMELINE_START_HOUR + Math.floor(minutes / 60);
  const m = minutes % 60;
  return fromZonedTime(
    `${dateStr}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`,
    timezone,
  );
}

export function DayTimeline({
  date,
  timezone,
  intents,
  initialBlocks,
}: {
  date: string;
  timezone: string;
  intents: { id: string; name: string; colorHex: string }[];
  initialBlocks: BlockView[];
}) {
  const blocks = useDayStore((s) => s.blocks);
  const setBlocks = useDayStore((s) => s.setBlocks);
  const upsertLocal = useDayStore((s) => s.upsertBlock);
  const removeLocal = useDayStore((s) => s.removeBlock);

  const [selected, setSelected] = useState<BlockView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBlocks(initialBlocks);
  }, [initialBlocks, setBlocks]);

  const defaultIntentId = intents[0]?.id ?? "";

  const handleCreate = useCallback(
    async (startMin: number, endMin: number) => {
      const startAt = dateFromMinutes(date, startMin, timezone);
      const endAt = dateFromMinutes(date, endMin, timezone);
      const intent = intents[0];
      const res = await upsertTimeBlock({
        title: "New block",
        intentTypeId: intent?.id ?? defaultIntentId,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
      });
      if ("error" in res) {
        setError(res.error);
        return;
      }
      const intentMeta = intents.find((i) => i.id === res.block.intentTypeId);
      upsertLocal({
        ...res.block,
        intentName: intentMeta?.name ?? "",
        colorHex: intentMeta?.colorHex ?? "#9CA3AF",
      });
      setSelected({
        ...res.block,
        intentName: intentMeta?.name ?? "",
        colorHex: intentMeta?.colorHex ?? "#9CA3AF",
      });
    },
    [date, timezone, intents, defaultIntentId, upsertLocal],
  );

  const onDelete = async (id: string) => {
    const res = await deleteTimeBlock({ id });
    if ("error" in res) {
      setError(res.error);
      return;
    }
    removeLocal(id);
    setSelected(null);
  };

  return (
    <div className="flex gap-6">
      <div className="relative flex-1">
        <div
          className="relative rounded-xl border border-[var(--border)] bg-[var(--card)]"
          style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}
        >
          {Array.from({ length: TOTAL_HOURS }, (_, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 border-t border-[var(--border)] text-xs text-[var(--muted)]"
              style={{ top: i * HOUR_HEIGHT }}
            >
              <span className="absolute -left-12 -top-2 w-10 text-right">
                {TIMELINE_START_HOUR + i}:00
              </span>
            </div>
          ))}

          {blocks.map((block) => {
            const startMin = minutesFromTimelineStart(
              parseISO(block.startAt),
              timezone,
            );
            const endMin = minutesFromTimelineStart(
              parseISO(block.endAt),
              timezone,
            );
            const top = (startMin / 60) * HOUR_HEIGHT;
            const height = Math.max(
              ((endMin - startMin) / 60) * HOUR_HEIGHT,
              24,
            );
            return (
              <button
                key={block.id}
                type="button"
                onClick={() => setSelected(block)}
                className={cn(
                  "absolute left-12 right-4 overflow-hidden rounded-lg border border-white/20 px-2 py-1 text-left text-sm text-white shadow-sm",
                  block.isDraft && "border-dashed opacity-80",
                )}
                style={{
                  top,
                  height,
                  backgroundColor: block.colorHex,
                }}
              >
                <span className="font-medium">{block.title}</span>
                <span className="block text-xs opacity-90">
                  {block.intentName}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            className="absolute bottom-4 right-4 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white shadow-lg"
            onClick={() => handleCreate(9 * 60, 10 * 60 + 30)}
          >
            + Add block
          </button>
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>

      {selected && (
        <BlockEditor
          block={selected}
          intents={intents}
          onClose={() => setSelected(null)}
          onSave={async (data) => {
            const res = await upsertTimeBlock(data);
            if ("error" in res) {
              setError(res.error);
              return;
            }
            const intentMeta = intents.find(
              (i) => i.id === res.block.intentTypeId,
            );
            const updated: BlockView = {
              ...res.block,
              intentName: intentMeta?.name ?? "",
              colorHex: intentMeta?.colorHex ?? "#9CA3AF",
            };
            upsertLocal(updated);
            setSelected(updated);
          }}
          onDelete={() => onDelete(selected.id)}
        />
      )}
    </div>
  );
}
