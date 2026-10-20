import { authenticatedRequest } from "@/lib/auth";

export type ProfilePreferences = {
  dailyCalorieGoalKcal: number | null;
  timezone: string | null;
};

type PreferencesResponse = {
  preferences: ProfilePreferences;
};

export async function getProfilePreferences(): Promise<ProfilePreferences> {
  const data = await authenticatedRequest<PreferencesResponse>(
    "/profile/preferences",
  );

  return data.preferences;
}

export async function updateProfilePreferences(
  changes: Partial<ProfilePreferences>,
): Promise<ProfilePreferences> {
  const data = await authenticatedRequest<PreferencesResponse>(
    "/profile/preferences",
    {
      method: "PATCH",
      body: changes,
    },
  );

  return data.preferences;
}