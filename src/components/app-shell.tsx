import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { isoWeekStart, todayInTz } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { computeWeekSummary } from "@/lib/week-summary";
import { WeekIntentMeter } from "@/components/week-intent-meter";

const nav = [
  { href: (d: string) => `/day/${d}`, label: "Today" },
  { href: () => `/week`, label: "Week" },
  { href: (d: string) => `/reflect/${d}`, label: "Reflect" },
  { href: () => `/settings/intents`, label: "Intents" },
];

export async function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user) return null;

  const today = todayInTz(user.timezone);
  const weekStart = isoWeekStart(today, user.timezone);
  const intents = await prisma.intentType.findMany({
    where: { userId: user.id, archivedAt: null },
    orderBy: { sortOrder: "asc" },
  });
  const weekSummary = await computeWeekSummary(
    user.id,
    weekStart,
    user.timezone,
    intents,
  );

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--card)] p-4">
        <Link href="/" className="mb-6 text-lg font-semibold text-[var(--accent)]">
          IntentDay
        </Link>
        <nav className="flex flex-col gap-1">
          {nav.map((item) => {
            const href =
              item.label === "Today"
                ? `/day/${today}`
                : item.label === "Reflect"
                  ? `/reflect/${today}`
                  : item.href(today);
            return (
              <Link
                key={item.label}
                href={href}
                className="rounded-lg px-3 py-2 text-sm hover:bg-[var(--surface)]"
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-6">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            This week
          </p>
          <WeekIntentMeter budgets={weekSummary.budgets} intents={intents} />
        </div>
        <form
          className="mt-auto pt-4"
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--surface)]"
          >
            Sign out
          </button>
        </form>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
