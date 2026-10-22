import { ApiError,authenticatedRequest } from "@/lib/auth";
import { getProfilePreferences } from "@/lib/preferences";

export type DailySummary = {
    date: string;
    timezone: string;
    startsAt: string;
    endsAt: string;
    consumedKcal: number;
    mealCount: number;
    dailyCalorieGoalKcal: number | null;
    goalStatus: "set" | "unset" | "unknown";
    remainingKcal: number | null;
    isOverGoal: boolean | null;
};

type DailySummaryResponse = {
    summary: DailySummary;
};

export async function getDailySummary(
    date: string,
): Promise<DailySummary> {
    const data = await authenticatedRequest<DailySummaryResponse>(
        `/daily-summary?date=${encodeURIComponent(date)}`,
    );
    return data.summary;
}

export function getDateInTimezone(
  timezone: string,
  instant = new Date(),
): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    calendar: "iso8601",
    numberingSystem: "latn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Could not determine today's date in your saved timezone.");
  }

  return `${year.padStart(4, "0")}-${month}-${day}`;
}

export async function getTodaysSummary(): Promise<DailySummary> {
  const preferences = await getProfilePreferences();
  let timezone = preferences.timezone;

  if (timezone === null) {
    throw new ApiError(
      "Set your timezone in Profile before viewing daily summaries.",
      409,
    );
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const date = getDateInTimezone(timezone);
    const summary = await getDailySummary(date);

    if (summary.date === getDateInTimezone(summary.timezone)) {
      return summary;
    }

    timezone = summary.timezone;
  }

  throw new Error("The date or timezone changed. Please try again.");
}