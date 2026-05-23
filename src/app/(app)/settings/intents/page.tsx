import { redirect } from "next/navigation";
import { listIntentTypes } from "@/lib/actions";
import { IntentSettings } from "@/components/intent-settings";

export default async function IntentSettingsPage() {
  const data = await listIntentTypes();
  if ("error" in data) redirect("/login");

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Intent types</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        Customize how you label your time.
      </p>
      <IntentSettings initialIntents={data.intents} />
    </div>
  );
}
