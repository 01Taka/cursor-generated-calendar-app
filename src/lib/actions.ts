"use server";

import { differenceInMinutes, format as formatDate } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { z } from "zod";
import {
  addDaysToDateString,
  dayBoundsUtc,
  isoWeekStart,
  weekBoundsUtc,
} from "@/lib/dates";
import { unauthorized } from "@/lib/action-errors";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeWeekSummary } from "@/lib/week-summary";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

async function getActiveIntents(userId: string) {
  return prisma.intentType.findMany({
    where: { userId, archivedAt: null },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getDayView(input: { date: string }) {
  const schema = z.object({ date: dateSchema });
  let user;
  try {
    user = await requireUser();
  } catch {
    return unauthorized();
  }
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: "INVALID_INPUT" as const };

  const { date } = parsed.data;
  const timezone = user.timezone;
  const { start, end } = dayBoundsUtc(date, timezone);
  const weekStart = isoWeekStart(date, timezone);

  const intents = await getActiveIntents(user.id);
  const [blocks, reflection] = await Promise.all([
    prisma.timeBlock.findMany({
      where: { userId: user.id, startAt: { gte: start, lt: end } },
      include: { intentType: true },
      orderBy: { startAt: "asc" },
    }),
    prisma.dayReflection.findUnique({
      where: {
        userId_reflectDate: {
          userId: user.id,
          reflectDate: new Date(`${date}T00:00:00.000Z`),
        },
      },
    }),
  ]);

  const weekSummary = await computeWeekSummary(
    user.id,
    weekStart,
    timezone,
    intents,
  );

  return {
    date,
    blocks: blocks.map((b) => ({
      id: b.id,
      title: b.title,
      intentTypeId: b.intentTypeId,
      intentName: b.intentType.name,
      colorHex: b.intentType.colorHex,
      startAt: b.startAt.toISOString(),
      endAt: b.endAt.toISOString(),
      isDraft: b.isDraft,
    })),
    intents: intents.map((i) => ({
      id: i.id,
      name: i.name,
      colorHex: i.colorHex,
      sortOrder: i.sortOrder,
      archived: false,
    })),
    weekSummary,
    hasReflection: !!reflection,
  };
}

const upsertBlockSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(200),
  intentTypeId: z.string(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  isDraft: z.boolean().optional(),
});

export async function upsertTimeBlock(
  input: z.infer<typeof upsertBlockSchema>,
) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return unauthorized();
  }
  const parsed = upsertBlockSchema.safeParse(input);
  if (!parsed.success) return { error: "INVALID_INPUT" as const };

  const startAt = new Date(parsed.data.startAt);
  const endAt = new Date(parsed.data.endAt);
  if (
    endAt <= startAt ||
    differenceInMinutes(endAt, startAt) < 5
  ) {
    return { error: "INVALID_RANGE" as const };
  }

  const intent = await prisma.intentType.findFirst({
    where: { id: parsed.data.intentTypeId, userId: user.id },
  });
  if (!intent) return { error: "INTENT_NOT_FOUND" as const };

  const data = {
    title: parsed.data.title,
    intentTypeId: parsed.data.intentTypeId,
    startAt,
    endAt,
    isDraft: parsed.data.isDraft ?? false,
  };

  const block = parsed.data.id
    ? await prisma.timeBlock.update({
        where: { id: parsed.data.id, userId: user.id },
        data,
      })
    : await prisma.timeBlock.create({
        data: { ...data, userId: user.id },
      });

  const date = startAt.toISOString().slice(0, 10);
  const weekStart = isoWeekStart(date, user.timezone);
  const intents = await getActiveIntents(user.id);
  const weekSummary = await computeWeekSummary(
    user.id,
    weekStart,
    user.timezone,
    intents,
  );

  return {
    block: {
      id: block.id,
      title: block.title,
      intentTypeId: block.intentTypeId,
      startAt: block.startAt.toISOString(),
      endAt: block.endAt.toISOString(),
      isDraft: block.isDraft,
    },
    weekSummary,
  };
}

export async function deleteTimeBlock(input: { id: string }) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return unauthorized();
  }
  const existing = await prisma.timeBlock.findFirst({
    where: { id: input.id, userId: user.id },
  });
  if (!existing) return { error: "NOT_FOUND" as const };

  await prisma.timeBlock.delete({ where: { id: input.id } });

  const weekStart = isoWeekStart(
    existing.startAt.toISOString().slice(0, 10),
    user.timezone,
  );
  const intents = await getActiveIntents(user.id);
  const weekSummary = await computeWeekSummary(
    user.id,
    weekStart,
    user.timezone,
    intents,
  );

  return { ok: true as const, weekSummary };
}

export async function getWeekView(input: { weekStart: string }) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return unauthorized();
  }
  const parsed = z.object({ weekStart: dateSchema }).safeParse(input);
  if (!parsed.success) return unauthorized();

  const { weekStart } = parsed.data;
  const { start, end } = weekBoundsUtc(weekStart, user.timezone);
  const intents = await getActiveIntents(user.id);

  const blocks = await prisma.timeBlock.findMany({
    where: {
      userId: user.id,
      startAt: { gte: start, lt: end },
      isDraft: false,
    },
    include: { intentType: true },
    orderBy: { startAt: "asc" },
  });

  const days: {
    date: string;
    blocks: {
      id: string;
      title: string;
      colorHex: string;
      startAt: string;
      endAt: string;
    }[];
  }[] = [];

  for (let i = 0; i < 7; i++) {
    const date = addDaysToDateString(weekStart, i);
    const { start: ds, end: de } = dayBoundsUtc(date, user.timezone);
    days.push({
      date,
      blocks: blocks
        .filter((b) => b.startAt >= ds && b.startAt < de)
        .map((b) => ({
          id: b.id,
          title: b.title,
          colorHex: b.intentType.colorHex,
          startAt: b.startAt.toISOString(),
          endAt: b.endAt.toISOString(),
        })),
    });
  }

  const summary = await computeWeekSummary(
    user.id,
    weekStart,
    user.timezone,
    intents,
  );

  return {
    weekStart,
    days,
    intents: intents.map((i) => ({
      id: i.id,
      name: i.name,
      colorHex: i.colorHex,
    })),
    budgets: summary.budgets,
  };
}

export async function saveWeeklyIntentBudgets(input: {
  weekStart: string;
  targets: { intentTypeId: string; targetHours: number }[];
}) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return unauthorized();
  }
  const schema = z.object({
    weekStart: dateSchema,
    targets: z.array(
      z.object({
        intentTypeId: z.string(),
        targetHours: z.number().min(0).max(168),
      }),
    ),
  });
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: "INVALID_INPUT" as const };

  const weekStartDate = new Date(`${parsed.data.weekStart}T00:00:00.000Z`);

  await prisma.$transaction(
    parsed.data.targets.map((t) =>
      prisma.weeklyIntentBudget.upsert({
        where: {
          userId_intentTypeId_weekStart: {
            userId: user.id,
            intentTypeId: t.intentTypeId,
            weekStart: weekStartDate,
          },
        },
        create: {
          userId: user.id,
          intentTypeId: t.intentTypeId,
          weekStart: weekStartDate,
          targetHours: t.targetHours,
        },
        update: { targetHours: t.targetHours },
      }),
    ),
  );

  const intents = await getActiveIntents(user.id);
  const summary = await computeWeekSummary(
    user.id,
    parsed.data.weekStart,
    user.timezone,
    intents,
  );
  return { budgets: summary.budgets };
}

export async function getReflection(input: { date: string }) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return unauthorized();
  }
  const parsed = z.object({ date: dateSchema }).safeParse(input);
  if (!parsed.success) return unauthorized();

  const { date } = parsed.data;
  const { start, end } = dayBoundsUtc(date, user.timezone);
  const reflectDate = new Date(`${date}T00:00:00.000Z`);

  const [blocks, reflection] = await Promise.all([
    prisma.timeBlock.findMany({
      where: { userId: user.id, startAt: { gte: start, lt: end } },
      include: { intentType: true },
      orderBy: { startAt: "asc" },
    }),
    prisma.dayReflection.findUnique({
      where: { userId_reflectDate: { userId: user.id, reflectDate } },
      include: { carryBlocks: true },
    }),
  ]);

  return {
    date,
    blocks: blocks.map((b) => ({
      id: b.id,
      title: b.title,
      intentTypeId: b.intentTypeId,
      colorHex: b.intentType.colorHex,
      startAt: b.startAt.toISOString(),
      endAt: b.endAt.toISOString(),
    })),
    reflection: reflection
      ? {
          note: reflection.note,
          carryBlockIds: reflection.carryBlocks.map((c) => c.timeBlockId),
        }
      : null,
  };
}

export async function saveDayReflection(input: {
  date: string;
  note: string;
  carryBlockIds: string[];
}) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return unauthorized();
  }
  const schema = z.object({
    date: dateSchema,
    note: z.string().max(2000),
    carryBlockIds: z.array(z.string()),
  });
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: "INVALID_INPUT" as const };

  const reflectDate = new Date(`${parsed.data.date}T00:00:00.000Z`);
  const tomorrowDate = addDaysToDateString(parsed.data.date, 1);
  const { start: tomorrowStart } = dayBoundsUtc(tomorrowDate, user.timezone);

  const reflection = await prisma.$transaction(async (tx) => {
    const saved = await tx.dayReflection.upsert({
      where: {
        userId_reflectDate: { userId: user.id, reflectDate },
      },
      create: {
        userId: user.id,
        reflectDate,
        note: parsed.data.note,
      },
      update: { note: parsed.data.note },
    });

    await tx.dayReflectionCarryBlock.deleteMany({
      where: { reflectionId: saved.id },
    });

    if (parsed.data.carryBlockIds.length > 0) {
      await tx.dayReflectionCarryBlock.createMany({
        data: parsed.data.carryBlockIds.map((timeBlockId) => ({
          reflectionId: saved.id,
          timeBlockId,
        })),
      });
    }

    const sources = await tx.timeBlock.findMany({
      where: {
        id: { in: parsed.data.carryBlockIds },
        userId: user.id,
      },
    });

    let carriedCount = 0;
    for (const source of sources) {
      const existing = await tx.timeBlock.findFirst({
        where: {
          userId: user.id,
          carryForwardSourceId: source.id,
          startAt: { gte: tomorrowStart },
        },
      });
      if (existing) continue;

      const duration = source.endAt.getTime() - source.startAt.getTime();
      const zonedStart = toZonedTime(source.startAt, user.timezone);
      const timePart = formatDate(zonedStart, "HH:mm:ss");
      const newStart = fromZonedTime(`${tomorrowDate}T${timePart}`, user.timezone);
      const newEnd = new Date(newStart.getTime() + duration);

      await tx.timeBlock.create({
        data: {
          userId: user.id,
          intentTypeId: source.intentTypeId,
          title: source.title,
          startAt: newStart,
          endAt: newEnd,
          isDraft: true,
          carryForwardSourceId: source.id,
        },
      });
      carriedCount += 1;
    }

    return { saved, carriedCount };
  });

  return {
    reflectionId: reflection.saved.id,
    carriedCount: reflection.carriedCount,
    tomorrowDate,
  };
}

export async function listIntentTypes() {
  let user;
  try {
    user = await requireUser();
  } catch {
    return unauthorized();
  }
  const intents = await prisma.intentType.findMany({
    where: { userId: user.id },
    orderBy: { sortOrder: "asc" },
  });
  return {
    intents: intents.map((i) => ({
      id: i.id,
      name: i.name,
      colorHex: i.colorHex,
      sortOrder: i.sortOrder,
      archived: !!i.archivedAt,
      isDefault: i.isDefault,
    })),
  };
}

export async function upsertIntentType(input: {
  id?: string;
  name: string;
  colorHex: string;
  sortOrder?: number;
}) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return unauthorized();
  }
  const schema = z.object({
    id: z.string().optional(),
    name: z.string().min(1).max(50),
    colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    sortOrder: z.number().int().min(0).optional(),
  });
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: "INVALID_INPUT" as const };

  const activeCount = await prisma.intentType.count({
    where: { userId: user.id, archivedAt: null },
  });
  if (!parsed.data.id && activeCount >= 12) {
    return { error: "MAX_INTENTS" as const };
  }

  const duplicate = await prisma.intentType.findFirst({
    where: {
      userId: user.id,
      name: { equals: parsed.data.name, mode: "insensitive" },
      archivedAt: null,
      ...(parsed.data.id ? { NOT: { id: parsed.data.id } } : {}),
    },
  });
  if (duplicate) return { error: "DUPLICATE_NAME" as const };

  const intent = parsed.data.id
    ? await prisma.intentType.update({
        where: { id: parsed.data.id, userId: user.id },
        data: {
          name: parsed.data.name,
          colorHex: parsed.data.colorHex,
          sortOrder: parsed.data.sortOrder,
        },
      })
    : await prisma.intentType.create({
        data: {
          userId: user.id,
          name: parsed.data.name,
          colorHex: parsed.data.colorHex,
          sortOrder: parsed.data.sortOrder ?? activeCount,
        },
      });

  return {
    intent: {
      id: intent.id,
      name: intent.name,
      colorHex: intent.colorHex,
      sortOrder: intent.sortOrder,
      archived: !!intent.archivedAt,
    },
  };
}

export async function archiveIntentType(input: { id: string }) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return unauthorized();
  }
  const intent = await prisma.intentType.findFirst({
    where: { id: input.id, userId: user.id },
  });
  if (!intent) return { error: "NOT_FOUND" as const };
  if (intent.isDefault && intent.name === "Uncategorized") {
    return { error: "CANNOT_ARCHIVE_DEFAULT" as const };
  }

  await prisma.intentType.update({
    where: { id: input.id },
    data: { archivedAt: new Date() },
  });

  return { ok: true as const };
}
