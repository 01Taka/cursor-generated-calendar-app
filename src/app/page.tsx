import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { todayInTz } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const session = await auth();
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    const today = todayInTz(user?.timezone ?? "UTC");
    redirect(`/day/${today}`);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
        IntentDay
      </p>
      <h1 className="mt-4 text-4xl font-bold leading-tight">
        Your calendar, organized by why—not just what.
      </h1>
      <p className="mt-4 text-lg text-[var(--muted)]">
        Color every block by intention. Set weekly intent budgets. Reflect at
        day&apos;s end and carry what matters into tomorrow.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/login"
          className="rounded-lg bg-[var(--accent)] px-6 py-3 font-medium text-white"
        >
          Sign in with GitHub
        </Link>
      </div>
      <ul className="mt-12 grid gap-4 text-sm text-[var(--muted)] sm:grid-cols-3">
        <li className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <strong className="text-[var(--text)]">Intent colors</strong>
          <p className="mt-2">See Deep Work, Recovery, and more at a glance.</p>
        </li>
        <li className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <strong className="text-[var(--text)]">Weekly budgets</strong>
          <p className="mt-2">Plan hours per intent; track actuals all week.</p>
        </li>
        <li className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <strong className="text-[var(--text)]">Evening reflection</strong>
          <p className="mt-2">Note the day and carry blocks forward as drafts.</p>
        </li>
      </ul>
    </div>
  );
}
