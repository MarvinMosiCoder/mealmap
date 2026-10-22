import { ApiError } from "@/lib/auth";
import { getTodaysSummary, type DailySummary } from "@/lib/daily-summary";
import { useAuth } from "@/providers/auth-provider";
import { Link, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, Pressable, Text, View } from "react-native";
import { NutritionSummary } from "@/components/nutrition-summary";

const cardClassName = "mb-[20px] rounded-[24px] bg-surface p-[20px]";

type LoadError = {
  message: string;
  status?: number;
};

function ProfileAction() {
  return (
    <Link href="/profile" asChild>
      <Pressable
        accessibilityRole="button"
        className="mt-[12px] min-h-[48px] items-center justify-center rounded-[14px] border border-primary px-[16px]"
      >
        <Text className="font-poppins-semibold text-[13px] text-primary">
          Open Profile
        </Text>
      </Pressable>
    </Link>
  );
}

export function HomeDailySummary() {
  const { refreshSession } = useAuth();
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<LoadError | null>(null);
  const requestVersion = useRef(0);
  const busy = useRef(false);

    const focused = useRef(false);
    const midnightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearMidnightTimer = useCallback(() => {
    if (midnightTimer.current !== null) {
            clearTimeout(midnightTimer.current);
            midnightTimer.current = null;
        }
    }, []);

  const load = useCallback(async () => {
    if (
        busy.current ||
        !focused.current ||
        AppState.currentState !== "active"
    ) return;

    busy.current = true;
    const version = ++requestVersion.current;
    setIsLoading(true);
    setLoadError(null);
    setSummary(null);

    try {
      const result = await getTodaysSummary();
      if (version === requestVersion.current) setSummary(result);
    } catch (cause) {
      if (version !== requestVersion.current) return;

      setLoadError({
        message: cause instanceof Error
          ? cause.message
          : "Could not load today's summary.",
        status: cause instanceof ApiError ? cause.status : undefined,
      });

      if (cause instanceof ApiError && cause.status === 401) {
        void refreshSession(false);
      }
    } finally {
      if (version === requestVersion.current) {
        busy.current = false;
        setIsLoading(false);
      }
    }
  }, [refreshSession]);

    useFocusEffect(
        useCallback(() => {
            focused.current = true;
            let previousState = AppState.currentState;

            const subscription = AppState.addEventListener("change", (nextState) => {
            const wasActive = previousState === "active";
            previousState = nextState;

            if (nextState !== "active") {
                requestVersion.current += 1;
                busy.current = false;
                clearMidnightTimer();
                return;
            }

            if (!wasActive) void load();
            });

            void load();

            return () => {
            focused.current = false;
            requestVersion.current += 1;
            busy.current = false;
            clearMidnightTimer();
            subscription.remove();
            };
        }, [clearMidnightTimer, load]),
    );

    useEffect(() => {
    clearMidnightTimer();

    if (
        !summary ||
        !focused.current ||
        AppState.currentState !== "active"
    ) return;

    const delay = Math.max(
        new Date(summary.endsAt).getTime() - Date.now() + 100,
        100,
    );

    midnightTimer.current = setTimeout(() => void load(), delay);

    return clearMidnightTimer;
    }, [summary, load, clearMidnightTimer]);

  if (isLoading) {
    return (
      <View className={cardClassName}>
        <ActivityIndicator
          color="#0C7762"
          accessibilityLabel="Loading today's summary"
        />
      </View>
    );
  }

  if (loadError) {
    return (
      <View className={cardClassName}>
        <Text
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          className="font-poppins text-[13px] text-[#B93F3F]"
        >
          {loadError.message}
        </Text>
        <Pressable
          onPress={() => void load()}
          accessibilityRole="button"
          className="mt-[12px] min-h-[48px] items-center justify-center rounded-[14px] bg-primary"
        >
          <Text className="font-poppins-semibold text-[13px] text-white">
            Try again
          </Text>
        </Pressable>
        {loadError.status === 409 ? <ProfileAction /> : null}
      </View>
    );
  }

  if (!summary) return null;
   return <NutritionSummary summary={summary} />;
}