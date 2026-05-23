import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/");

  const params = await searchParams;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-bold">Sign in to IntentDay</h1>
      <p className="mt-2 text-[var(--muted)]">
        Use GitHub to save your intents and time blocks.
      </p>
      {params.error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          Authentication failed. Please try again.
        </p>
      )}
      <form
        className="mt-8"
        action={async () => {
          "use server";
          await signIn("github", { redirectTo: "/" });
        }}
      >
        <button
          type="submit"
          className="w-full rounded-lg bg-[var(--accent)] py-3 font-medium text-white"
        >
          Continue with GitHub
        </button>
      </form>
      <Link href="/" className="mt-4 text-center text-sm text-[var(--muted)]">
        Back to home
      </Link>
    </div>
  );
}
