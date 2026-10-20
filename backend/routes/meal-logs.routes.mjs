import express from "express";

const allowedFields = [
  "mealName",
  "mealCategory",
  "servingQuantity",
  "kcal",
  "eatenAt",
];

const mealCategories = ["breakfast", "lunch", "dinner", "snacks"];

function validateMealLog(req, res, next) {
   const body = req.body;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return res.status(400).json({
        message: "Send a JSON object.",
        });
    }

    if (Object.keys(body).some((field) => !allowedFields.includes(field))) {
        return res.status(400).json({
        message:
            "Send mealName, mealCategory, servingQuantity, kcal and eatenAt only.",
        });
    }

    const mealName =
        typeof body.mealName === "string" ? body.mealName.trim() : "";

    if (
        !mealName ||
        [...mealName].length > 200 ||
        mealName.includes("\u0000")
    ) {
        return res.status(400).json({
        message:
            "Meal name must contain 1 to 200 characters and no null characters.",
        });
    }

    if (!mealCategories.includes(body.mealCategory)) {
        return res.status(400).json({
        message: "Choose breakfast, lunch, dinner or snacks.",
        });
    }

    const { servingQuantity, kcal } = body;

    if (
        typeof servingQuantity !== "number" ||
        !Number.isFinite(servingQuantity) ||
        servingQuantity <= 0 ||
        servingQuantity > 9999999.999 ||
        !/^\d+(?:\.\d{1,3})?$/.test(String(servingQuantity))
    ) {
        return res.status(400).json({
        message:
            "Serving quantity must be between 0.001 and 9999999.999, with at most 3 decimal places.",
        });
    }

    if (!Number.isInteger(kcal) || kcal < 0 || kcal > 2147483647) {
        return res.status(400).json({
        message: "Kcal must be a whole number between 0 and 2147483647.",
        });
    }

    if (
        typeof body.eatenAt !== "string" ||
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(body.eatenAt)
    ) {
        return res.status(400).json({
        message:
            "Send eatenAt as a UTC timestamp, for example 2026-10-20T04:30:00.000Z.",
        });
    }

    const eatenAt = new Date(body.eatenAt);

    if (
        !Number.isFinite(eatenAt.getTime()) ||
        eatenAt.toISOString() !== body.eatenAt
    ) {
        return res.status(400).json({
        message: "eatenAt must be a real date and time.",
        });
    }

    res.locals.mealLog = {
        mealName,
        mealCategory: body.mealCategory,
        servingQuantity,
        kcal,
        eatenAt,
    };

  return next();
}

export function createMealLogsRouter({ pool, requireAuth }) {
  const router = express.Router();

  router.use(requireAuth);

  router.post("/", validateMealLog, async (req, res) => {
    const {
        mealName,
        mealCategory,
        servingQuantity,
        kcal,
        eatenAt,
    } = res.locals.mealLog;

    const result = await pool.query(
      `INSERT INTO public.meal_logs (
        user_id,
        meal_name,
        meal_category,
        serving_quantity,
        kcal,
        source,
        eaten_at
      )
      VALUES ($1, $2, $3, $4, $5, 'manual', $6)
      RETURNING
        id::text AS id,
        meal_name AS "mealName",
        meal_category AS "mealCategory",
        serving_quantity::double precision AS "servingQuantity",
        kcal,
        source,
        eaten_at AS "eatenAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt"`,
      [
        req.user.id,
        mealName,
        mealCategory,
        servingQuantity,
        kcal,
        eatenAt,
      ],
    );

    return res.status(201).json({
      mealLog: result.rows[0],
    });
  });

  router.get("/", async (req, res) => {
    const query = req.query;
    const allowedQueryFields = ["limit", "offset"];

    if (
        Object.keys(query).some(
        (field) => !allowedQueryFields.includes(field),
        )
    ) {
        return res.status(400).json({
        message: "Supported query parameters are limit and offset.",
        });
    }

    const limitInput = query.limit ?? "20";
    const offsetInput = query.offset ?? "0";

    if (
        typeof limitInput !== "string" ||
        typeof offsetInput !== "string" ||
        !/^\d+$/.test(limitInput) ||
        !/^\d+$/.test(offsetInput)
    ) {
        return res.status(400).json({
        message: "limit and offset must be whole numbers.",
        });
    }

    const limit = Number(limitInput);
    const offset = Number(offsetInput);

    if (
        !Number.isInteger(limit) ||
        limit < 1 ||
        limit > 100 ||
        !Number.isInteger(offset) ||
        offset < 0 ||
        offset > 2147483647
    ) {
        return res.status(400).json({
        message:
            "limit must be between 1 and 100; offset must be between 0 and 2147483647.",
        });
    }

    const result = await pool.query(
        `SELECT
        id::text AS id,
        meal_name AS "mealName",
        meal_category AS "mealCategory",
        serving_quantity::double precision AS "servingQuantity",
        kcal,
        source,
        eaten_at AS "eatenAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
        FROM public.meal_logs
        WHERE user_id = $1
        ORDER BY eaten_at DESC, id DESC
        LIMIT $2 OFFSET $3`,
        [req.user.id, limit + 1, offset],
    );

    return res.json({
        mealLogs: result.rows.slice(0, limit),
        pagination: {
        limit,
        offset,
        hasMore: result.rows.length > limit,
        },
    });
  });

  router.put("/:id", validateMealLog, async (req, res) => {
    const { id } = req.params;

    if (
        !/^[1-9]\d{0,18}$/.test(id) ||
        BigInt(id) > 9223372036854775807n
    ) {
        return res.status(400).json({
        message: "Enter a valid meal log ID.",
        });
    }

    const {
        mealName,
        mealCategory,
        servingQuantity,
        kcal,
        eatenAt,
    } = res.locals.mealLog;

    const result = await pool.query(
        `UPDATE public.meal_logs
        SET
        meal_name = $3,
        meal_category = $4,
        serving_quantity = $5,
        kcal = $6,
        eaten_at = $7,
        updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING
        id::text AS id,
        meal_name AS "mealName",
        meal_category AS "mealCategory",
        serving_quantity::double precision AS "servingQuantity",
        kcal,
        source,
        eaten_at AS "eatenAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt"`,
        [
        id,
        req.user.id,
        mealName,
        mealCategory,
        servingQuantity,
        kcal,
        eatenAt,
        ],
    );

    const mealLog = result.rows[0];

    if (!mealLog) {
        return res.status(404).json({
        message: "Meal log not found.",
        });
    }

    return res.json({ mealLog });
  });

  router.delete("/:id", async(req, res) => {
    const { id } = req.params;

    if (
        !/^[1-9]\d{0,18}$/.test(id) ||
        BigInt(id) > 9223372036854775807n
    ) {
        return res.status(400).json({
        message: "Enter a valid meal log ID.",
        });
    }

    const result = await pool.query(
        `DELETE FROM public.meal_logs
        WHERE id = $1 AND user_id = $2
        RETURNING id::text AS id`,
        [id, req.user.id],
    );
    if (!result.rows[0]) {
        return res.status(404).json({
        message: "Meal log not found.",
        });
    }

    return res.status(204).end();
  });

  return router;
}