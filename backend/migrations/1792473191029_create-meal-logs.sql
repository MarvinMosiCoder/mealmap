-- Up Migration

CREATE TABLE public.meal_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  user_id BIGINT NOT NULL
    REFERENCES public.users(id) ON DELETE CASCADE,

  meal_name TEXT NOT NULL
    CHECK (char_length(btrim(meal_name)) BETWEEN 1 AND 200),

  meal_category TEXT NOT NULL
    CHECK (
      meal_category IN ('breakfast', 'lunch', 'dinner', 'snacks')
    ),

  serving_quantity NUMERIC(10, 3) NOT NULL
    CHECK (
      serving_quantity > 0
      AND serving_quantity <> 'NaN'::numeric
    ),

  kcal INTEGER NOT NULL
    CHECK (kcal >= 0),

  source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'photo', 'recipe')),

  eaten_at TIMESTAMPTZ NOT NULL
    CHECK (isfinite(eaten_at)),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX meal_logs_user_eaten_at_index
  ON public.meal_logs (user_id, eaten_at DESC);

COMMENT ON COLUMN public.meal_logs.kcal IS
  'Total kcal for the logged portion, not kcal per serving.';

COMMENT ON COLUMN public.meal_logs.serving_quantity IS
  'Number of servings actually eaten.';

-- Down Migration

DROP TABLE public.meal_logs;