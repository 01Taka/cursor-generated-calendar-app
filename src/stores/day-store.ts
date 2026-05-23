"use client";

import { create } from "zustand";

export type BlockView = {
  id: string;
  title: string;
  intentTypeId: string;
  intentName: string;
  colorHex: string;
  startAt: string;
  endAt: string;
  isDraft: boolean;
};

type DayState = {
  blocks: BlockView[];
  setBlocks: (blocks: BlockView[]) => void;
  upsertBlock: (block: BlockView) => void;
  removeBlock: (id: string) => void;
};

export const useDayStore = create<DayState>((set) => ({
  blocks: [],
  setBlocks: (blocks) => set({ blocks }),
  upsertBlock: (block) =>
    set((s) => {
      const idx = s.blocks.findIndex((b) => b.id === block.id);
      if (idx >= 0) {
        const next = [...s.blocks];
        next[idx] = block;
        return { blocks: next };
      }
      return { blocks: [...s.blocks, block] };
    }),
  removeBlock: (id) =>
    set((s) => ({ blocks: s.blocks.filter((b) => b.id !== id) })),
}));
