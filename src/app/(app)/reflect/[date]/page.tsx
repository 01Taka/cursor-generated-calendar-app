import { redirect } from "next/navigation";
import { getReflection } from "@/lib/actions";
import { addDaysToDateString } from "@/lib/dates";
import { ReflectionForm } from "@/components/reflection-form";

export default async function ReflectPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const data = await getReflection({ date });
  if ("error" in data) redirect("/login");

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Evening reflection</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">{date}</p>
      <ReflectionForm
        date={date}
        blocks={data.blocks}
        initialNote={data.reflection?.note ?? ""}
        initialCarry={data.reflection?.carryBlockIds ?? []}
        tomorrowDate={addDaysToDateString(date, 1)}
      />
    </div>
  );
}
