import express from "express";

export function createProfileRouter({pool, requireAuth}){
    const router = express.Router();

    router.use(requireAuth);

    router.get("/preferences", async (req, res)=>{
        const result = await pool.query(
            `SELECT
                daily_calorie_goal_kcal AS "dailyCalorieGoalKcal",
                timezone
            FROM public.users
            WHERE id = $1`,
            [req.user.id],
        );

        const preferences = result.rows[0];

        if (!preferences) {
            return res.status(401).json({
                message: "Please sign in again.",
            });
        }

        return res.json({ preferences });
    });

    router.patch("/preferences", async (req, res)=>{
        const body = req.body;

        if(!body || typeof body !== "object" || Array.isArray(body)) {
            return res.status(400).json({
                message: "Send a JSON object.",
            });
        }

        const allowedFields = ["dailyCalorieGoalKcal","timezone"];
        const fields = Object.keys(body);

        if (
            fields.length === 0 ||
            fields.some((field) => !allowedFields.includes(field))
        ) {
            return res.status(400).json({
                message: "Send dailyCalorieGoalKcal and/or timezone only.",
            });
        }

        const hasGoal = Object.hasOwn(body, "dailyCalorieGoalKcal");
        const hasTimezone = Object.hasOwn(body, "timezone");

        const goal = hasGoal ? body.dailyCalorieGoalKcal : null;
        let timezone = hasTimezone ? body.timezone : null;
        
        if (
            hasGoal &&
            goal !== null &&
            (!Number.isInteger(goal) || goal <= 0 || goal > 2147483647)
        ) {
            return res.status(400).json({
            message: "Daily calorie goal must be a positive whole number within the supported range.",
            });
        }

        if (hasTimezone && timezone !== null) {
            if (
                typeof timezone !== "string" ||
                timezone.trim().length === 0 ||
                timezone.trim().length > 255
            ) {
                return res.status(400).json({
                    message: "Enter a timezone such as Asia/Manila.",
                });
            }

            timezone = timezone.trim();

            const timezoneResult = await pool.query(
                `SELECT EXISTS (
                    SELECT 1
                    FROM pg_catalog.pg_timezone_names
                    WHERE name = $1
                ) AS valid`,
                [timezone],
            );

            if (!timezoneResult.rows[0].valid) {
                return res.status(400).json({
                    message: "Timezone is not recognized. Use a name such as Asia/Manila.",
                });
            }
        }

        const result = await pool.query(
            `UPDATE public.users
            SET
                daily_calorie_goal_kcal = CASE
                    WHEN $2::boolean THEN $3::integer
                    ELSE daily_calorie_goal_kcal
                END,
                timezone = CASE
                    WHEN $4::boolean THEN $5::text
                    ELSE timezone
                END
            WHERE id = $1
            RETURNING
                daily_calorie_goal_kcal AS "dailyCalorieGoalKcal",
                timezone`,
            [req.user.id, hasGoal, goal, hasTimezone, timezone],
        );
        const preferences = result.rows[0];

        if (!preferences) {
            return res.status(401).json({
            message: "Please sign in again.",
            });
        }

        return res.json({ preferences });
    });

  return router;
}