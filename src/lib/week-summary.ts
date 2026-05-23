import type { IntentType } from "@prisma/client";
import { blockDurationHours, weekBoundsUtc } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export type BudgetRow = {
  intentTypeId: string;
  targetHours: number;
  actualHours: number;
};

export async function computeWeekSummary(
  userId: string,
  weekStart: string,
  timezone: string,
  intents: IntentType[],
): Promise<{ weekStart: string; budgets: BudgetRow[] }> {
  const { start, end } = weekBoundsUtc(weekStart, timezone);
  const weekStartDate = new Date(`${weekStart}T00:00:00.000Z`);

  const [blocks, budgetRows] = await Promise.all([
    prisma.timeBlock.findMany({
      where: {
        userId,
        startAt: { gte: start, lt: end },
        isDraft: false,
      },
    }),
    prisma.weeklyIntentBudget.findMany({
      where: { userId, weekStart: weekStartDate },
    }),
  ]);

  const actualByIntent = new Map<string, number>();
  for (const block of blocks) {
    const hours = blockDurationHours(block.startAt, block.endAt);
    actualByIntent.set(
      block.intentTypeId,
      (actualByIntent.get(block.intentTypeId) ?? 0) + hours,
    );
  }

  const targetByIntent = new Map(
    budgetRows.map((b) => [b.intentTypeId, b.targetHours]),
  );

  const budgets: BudgetRow[] = intents
    .filter((i) => !i.archivedAt)
    .map((intent) => ({
      intentTypeId: intent.id,
      targetHours: targetByIntent.get(intent.id) ?? 0,
      actualHours: actualByIntent.get(intent.id) ?? 0,
    }));

  return { weekStart, budgets };
}
