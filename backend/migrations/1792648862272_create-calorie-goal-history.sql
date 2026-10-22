-- Up Migration

CREATE TABLE public.calorie_goal_history (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL
    REFERENCES public.users(id) ON DELETE CASCADE,
  daily_calorie_goal_kcal INTEGER,
  effective_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

  CONSTRAINT calorie_goal_history_goal_positive
    CHECK (
      daily_calorie_goal_kcal IS NULL
      OR daily_calorie_goal_kcal > 0
    )
);

CREATE INDEX calorie_goal_history_user_effective_idx
ON public.calorie_goal_history (
  user_id,
  effective_at DESC,
  id DESC
);

-- Capture each existing account's current goal.
INSERT INTO public.calorie_goal_history (
  user_id,
  daily_calorie_goal_kcal
)
SELECT id, daily_calorie_goal_kcal
FROM public.users;

-- Down Migration

DROP TABLE public.calorie_goal_history;