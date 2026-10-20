-- Up Migration

ALTER TABLE public.users
  ADD COLUMN daily_calorie_goal_kcal INTEGER,
  ADD COLUMN timezone TEXT,
  ADD CONSTRAINT users_daily_calorie_goal_kcal_positive
    CHECK (daily_calorie_goal_kcal > 0);

-- Down Migration

ALTER TABLE public.users
  DROP CONSTRAINT users_daily_calorie_goal_kcal_positive,
  DROP COLUMN daily_calorie_goal_kcal,
  DROP COLUMN timezone;