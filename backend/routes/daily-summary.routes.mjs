import express from "express";

function isValidDate(value) {
    if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        value.startsWith("0000-")
    ) {
        return false;
    }

    const parsed = new Date(`${value}T00:00:00.000Z`);

    return (
        Number.isFinite(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === value
    );
}

export function createDailySummaryRouter({ pool, requireAuth }) {
    const router = express.Router();
    router.use(requireAuth);

    router.get("/", async (req, res) => {
        const { date } = req.query;

        if (Object.keys(req.query).some((field) => field !== "date")) {
            return res.status(400).json({
                message: "Supported query parameter is date.",
            });
        }

        if (!isValidDate(date)) {
            return res.status(400).json({
                message: "Send a real date in YYYY-MM-DD format.",
            });
        }

        const result = await pool.query(
            `WITH selected_day AS (
                SELECT
                    id AS user_id,
                    timezone,
                    $2::date::timestamp AT TIME ZONE timezone AS starts_at,
                    ($2::date + 1)::timestamp AT TIME ZONE timezone AS ends_at
                FROM public.users
                WHERE id = $1
            )
            SELECT
                d.timezone,
                d.starts_at AS "startsAt",
                d.ends_at AS "endsAt",
                totals.consumed_kcal AS "consumedKcal",
                totals.meal_count AS "mealCount",
                goal.daily_calorie_goal_kcal AS "dailyCalorieGoalKcal",
                CASE
                    WHEN goal.id IS NULL THEN 'unknown'
                    WHEN goal.daily_calorie_goal_kcal IS NULL THEN 'unset'
                    ELSE 'set'
                END AS "goalStatus"
            FROM selected_day AS d
            CROSS JOIN LATERAL (
                SELECT
                    COALESCE(SUM(m.kcal), 0)::text AS consumed_kcal,
                    COUNT(*)::text AS meal_count
                FROM public.meal_logs AS m
                WHERE m.user_id = d.user_id
                AND m.eaten_at >= d.starts_at
                AND m.eaten_at < d.ends_at
            ) AS totals
            LEFT JOIN LATERAL (
                SELECT h.id, h.daily_calorie_goal_kcal
                FROM public.calorie_goal_history AS h
                WHERE h.user_id = d.user_id
                AND h.effective_at < d.ends_at
                ORDER BY h.effective_at DESC, h.id DESC
                LIMIT 1
            ) AS goal ON TRUE`,
            [req.user.id, date],
        );

        const day = result.rows[0];
        if (!day) {
            return res.status(401).json({
                message: "Please sign in again.",
            });
        }
        if (day.timezone === null) {
            return res.status(409).json({
                message: "Set your timezone in Profile before viewing daily summaries.",
            });
        }

        const consumedKcal = Number(day.consumedKcal);
        const mealCount = Number(day.mealCount);

        if (
            !Number.isSafeInteger(consumedKcal) ||
            !Number.isSafeInteger(mealCount)
        ) {
            throw new Error("Daily summary totals exceed the supported range.");
        }

        const goal = day.dailyCalorieGoalKcal;

        return res.json({
            summary: {
                date,
                timezone: day.timezone,
                startsAt: day.startsAt,
                endsAt: day.endsAt,
                consumedKcal,
                mealCount,
                dailyCalorieGoalKcal: goal,
                goalStatus: day.goalStatus,
                remainingKcal: goal === null ? null : goal - consumedKcal,
                isOverGoal: goal === null ? null : consumedKcal > goal,
            },
        });
    });

    return router;
}