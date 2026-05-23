import Link from "next/link";
import { format, parseISO } from "date-fns";
import { redirect } from "next/navigation";
import { getDayView } from "@/lib/actions";
import { addDaysToDateString } from "@/lib/dates";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DayTimeline } from "@/components/day-timeline";

export default async function DayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  if (date === "today") {
    const session = await auth();
    const user = session?.user?.id
      ? await prisma.user.findUnique({ where: { id: session.user.id } })
      : null;
    const { todayInTz } = await import("@/lib/dates");
    redirect(`/day/${todayInTz(user?.timezone ?? "UTC")}`);
  }

  const data = await getDayView({ date });
  if ("error" in data) redirect("/login");

  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { id: session!.user!.id },
  });

  const showReflect =
    !data.hasReflection &&
    new Date().getHours() >= 20;

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {format(parseISO(`${date}T12:00:00.000Z`), "EEEE, MMM d")}
          </h1>
          <p className="text-sm text-[var(--muted)]">Day view · {date}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/day/${addDaysToDateString(date, -1)}`}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          >
            ← Prev
          </Link>
          <Link
            href={`/day/${addDaysToDateString(date, 1)}`}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          >
            Next →
          </Link>
        </div>
      </header>

      {showReflect && (
        <div className="mb-4 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-3 text-sm">
          Evening reflection ready.{" "}
          <Link href={`/reflect/${date}`} className="font-medium underline">
            Reflect on today
          </Link>
        </div>
      )}

      <DayTimeline
        date={date}
        timezone={user?.timezone ?? "UTC"}
        intents={data.intents}
        initialBlocks={data.blocks}
      />
    </div>
  );
}
