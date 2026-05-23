import {
  addDays,
  differenceInMinutes,
  format,
  parseISO,
  startOfWeek,
} from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

export function todayInTz(timezone: string): string {
  return format(toZonedTime(new Date(), timezone), "yyyy-MM-dd");
}

export function parseDateString(date: string): Date {
  return parseISO(`${date}T12:00:00.000Z`);
}

export function dayBoundsUtc(date: string, timezone: string) {
  const startLocal = fromZonedTime(`${date}T00:00:00`, timezone);
  const endLocal = fromZonedTime(`${date}T23:59:59.999`, timezone);
  const endExclusive = addDays(
    fromZonedTime(`${date}T00:00:00`, timezone),
    1,
  );
  return { start: startLocal, end: endExclusive, endInclusive: endLocal };
}

export function isoWeekStart(date: string, timezone: string): string {
  const zoned = toZonedTime(parseDateString(date), timezone);
  const monday = startOfWeek(zoned, { weekStartsOn: 1 });
  return format(monday, "yyyy-MM-dd");
}

export function weekBoundsUtc(weekStart: string, timezone: string) {
  const start = fromZonedTime(`${weekStart}T00:00:00`, timezone);
  const end = addDays(start, 7);
  return { start, end };
}

export function blockDurationHours(
  startAt: Date,
  endAt: Date,
): number {
  return differenceInMinutes(endAt, startAt) / 60;
}

export function addDaysToDateString(date: string, days: number): string {
  return format(addDays(parseDateString(date), days), "yyyy-MM-dd");
}

export const TIMELINE_START_HOUR = 6;
export const TIMELINE_END_HOUR = 23;
export const MIN_BLOCK_MINUTES = 5;
