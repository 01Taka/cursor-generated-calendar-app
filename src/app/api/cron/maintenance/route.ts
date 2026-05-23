import { NextResponse } from "next/server";
import { subDays } from "date-fns";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = subDays(new Date(), 7);
  const result = await prisma.timeBlock.deleteMany({
    where: { isDraft: true, createdAt: { lt: cutoff } },
  });

  return NextResponse.json({ deletedDrafts: result.count });
}
