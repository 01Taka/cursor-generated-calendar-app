import { prisma } from "@/lib/prisma";

const DEFAULT_INTENTS = [
  { name: "Deep Work", colorHex: "#4F46E5", sortOrder: 0 },
  { name: "Recovery", colorHex: "#10B981", sortOrder: 1 },
  { name: "Connection", colorHex: "#F59E0B", sortOrder: 2 },
  { name: "Admin", colorHex: "#6B7280", sortOrder: 3 },
  { name: "Uncategorized", colorHex: "#9CA3AF", sortOrder: 99 },
] as const;

export async function seedUserDefaults(userId: string): Promise<number> {
  const existing = await prisma.intentType.count({ where: { userId } });
  if (existing > 0) return 0;

  await prisma.intentType.createMany({
    data: DEFAULT_INTENTS.map((intent) => ({
      userId,
      name: intent.name,
      colorHex: intent.colorHex,
      sortOrder: intent.sortOrder,
      isDefault: true,
    })),
  });

  return DEFAULT_INTENTS.length;
}

export async function getUncategorizedIntent(userId: string) {
  let intent = await prisma.intentType.findFirst({
    where: { userId, name: "Uncategorized" },
  });
  if (!intent) {
    await seedUserDefaults(userId);
    intent = await prisma.intentType.findFirst({
      where: { userId, name: "Uncategorized" },
    });
  }
  return intent!;
}
