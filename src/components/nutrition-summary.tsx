import type { DailySummary } from "@/lib/daily-summary";
import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

const circumference = 2 * Math.PI * 37;

type Props = {
  summary: DailySummary;
};

export function NutritionSummary({ summary }: Props) {
  const goal = summary.dailyCalorieGoalKcal;
  const remaining = summary.remainingKcal;
  const progress = goal === null
    ? 0
    : Math.min(1, Math.max(0, summary.consumedKcal / goal));
  const ringColor = summary.isOverGoal ? "#B93F3F" : "#0C7762";
  const message = remaining === null
    ? summary.goalStatus === "unset"
      ? "Set a calorie goal in Profile."
      : "No calorie goal recorded for today."
    : remaining < 0
      ? `${Math.abs(remaining).toLocaleString()} kcal over goal`
      : `${remaining.toLocaleString()} kcal remaining`;

  return (
    <View className="mb-[20px] rounded-[24px] bg-surface p-[16px]">
      <View className="flex-row items-center gap-[16px]">
        <View
          accessible
          accessibilityLabel={goal === null
            ? `${summary.consumedKcal} kilocalories eaten. No recorded goal.`
            : `${summary.consumedKcal} of ${goal} kilocalories eaten.`}
          className="relative h-[88px] w-[88px] shrink-0"
        >
          <Svg width={88} height={88} viewBox="0 0 88 88" accessible={false}>
            <Circle
              cx={44}
              cy={44}
              r={37}
              fill="none"
              stroke="#E3F0EB"
              strokeWidth={8}
            />
            {progress > 0 ? (
              <Circle
                cx={44}
                cy={44}
                r={37}
                fill="none"
                stroke={ringColor}
                strokeWidth={8}
                strokeLinecap="round"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={circumference * (1 - progress)}
                rotation={-90}
                origin="44, 44"
              />
            ) : null}
          </Svg>

          <View className="absolute inset-0 items-center justify-center px-[8px]">
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
              className="font-poppins-bold text-[20px] text-text"
            >
              {summary.consumedKcal.toLocaleString()}
            </Text>
            <Text className="font-poppins text-[9px] text-muted">
              kcal eaten
            </Text>
          </View>
        </View>

        <View className="min-w-0 flex-1">
          <Text
            accessibilityRole="header"
            className="font-poppins-bold text-[16px] text-text"
          >
            Today&apos;s calories
          </Text>

          {goal !== null ? (
            <Text className="mt-[6px] font-poppins text-[12px] text-muted">
              Goal: {goal.toLocaleString()} kcal
            </Text>
          ) : null}

          <Text
            style={{ color: ringColor }}
            className="mt-[6px] font-poppins-semibold text-[14px]"
          >
            {message}
          </Text>

          <Text className="mt-[6px] font-poppins text-[12px] text-muted">
            {summary.mealCount} {summary.mealCount === 1 ? "meal" : "meals"} logged
          </Text>
        </View>
      </View>

      <Text className="mt-[12px] font-poppins text-[11px] text-muted">
        {summary.date} · {summary.timezone}
      </Text>

      {goal === null ? (
        <Link href="/profile" asChild>
          <Pressable
            accessibilityRole="button"
            className="mt-[12px] min-h-[48px] items-center justify-center rounded-[14px] border border-primary"
          >
            <Text className="font-poppins-semibold text-[13px] text-primary">
              Open Profile
            </Text>
          </Pressable>
        </Link>
      ) : null}
    </View>
  );
}