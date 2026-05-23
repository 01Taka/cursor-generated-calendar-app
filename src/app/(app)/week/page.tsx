import Link from "next/link";
import { redirect } from "next/navigation";
import { getWeekView } from "@/lib/actions";
import { addDaysToDateString, isoWeekStart, todayInTz } from "@/lib/dates";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WeekView } from "@/components/week-view";

export default async function WeekPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  const today = todayInTz(user?.timezone ?? "UTC");
  const params = await searchParams;
  const weekStart =
    params.week ?? isoWeekStart(today, user?.timezone ?? "UTC");

  const data = await getWeekView({ weekStart });
  if ("error" in data) redirect("/login");

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Week overview</h1>
          <p className="text-sm text-[var(--muted)]">Starting {weekStart}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/week?week=${addDaysToDateString(weekStart, -7)}`}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          >
            ← Prev week
          </Link>
          <Link
            href={`/week?week=${addDaysToDateString(weekStart, 7)}`}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          >
            Next week →
          </Link>
        </div>
      </header>
      <WeekView
        weekStart={data.weekStart}
        days={data.days}
        intents={data.intents}
        initialBudgets={data.budgets}
      />
    </div>
  );
}
