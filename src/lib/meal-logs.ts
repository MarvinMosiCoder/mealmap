import { authenticatedRequest } from "@/lib/auth";

export type MealCategory =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "snacks";

export type MealLogInput = {
  mealName: string;
  mealCategory: MealCategory;
  servingQuantity: number;
  kcal: number;
  eatenAt: string;
};

export type MealLog = MealLogInput & {
  id: string;
  source: "manual" | "photo" | "recipe";
  createdAt: string;
  updatedAt: string;
};

type MealLogResponse = {
  mealLog: MealLog;
};

export type MealLogsPage = {
  mealLogs: MealLog[];
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

export async function createMealLog(
    input: MealLogInput,
): Promise<MealLog> {
    const data = await authenticatedRequest<MealLogResponse>(
        "/meal-logs",
        {
            method: "POST",
            body: input,
        },
    );
    return data.mealLog;
}

export async function getMealLogs(
    options: { limit?: number; offset?: number } = {},
): Promise<MealLogsPage>{
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;

    return authenticatedRequest<MealLogsPage>(
        `/meal-logs?limit=${limit}&offset=${offset}`,
    );
}

export async function updateMealLog(
  id: string,
  input: MealLogInput,
): Promise<MealLog> {
  const data = await authenticatedRequest<MealLogResponse>(
    `/meal-logs/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      body: input,
    },
  );

  return data.mealLog;
}

export async function deleteMealLog(id: string): Promise<void> {
  await authenticatedRequest<void>(
    `/meal-logs/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    },
  );
}