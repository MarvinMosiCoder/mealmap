import { ApiError } from "@/lib/auth";
import { getMealLogs, type MealLog } from "@/lib/meal-logs";
import { useAuth } from "@/providers/auth-provider";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";

export function MealLogList() {
  const { refreshSession } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();

  const [meals, setMeals] = useState<MealLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");

  const requestVersion = useRef(0);
  const busyRef = useRef(false);
  const nextOffsetRef = useRef(0);

  const loadPage = useCallback(
    async (offset: number, version: number) => {
      try {
        const page = await getMealLogs({ limit: 20, offset });

        if (version !== requestVersion.current) return;

        setMeals((current) => {
          if (offset === 0) return page.mealLogs;

          const byId = new Map(current.map((meal) => [meal.id, meal]));

          for (const meal of page.mealLogs) {
            byId.set(meal.id, meal);
          }

          return [...byId.values()];
        });

        setHasMore(page.pagination.hasMore);
        nextOffsetRef.current =
          page.pagination.offset + page.pagination.limit;
      } catch (cause) {
        if (version !== requestVersion.current) return;

        setError(
          cause instanceof Error
            ? cause.message
            : "Could not load your meals.",
        );

        if (cause instanceof ApiError && cause.status === 401) {
          void refreshSession(false);
        }
      } finally {
        if (version === requestVersion.current) {
          busyRef.current = false;
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [refreshSession],
  );

  const reload = useCallback(() => {
    const version = ++requestVersion.current;

    busyRef.current = true;
    setIsLoading(true);
    setIsLoadingMore(false);
    setHasMore(false);
    setError("");

    void loadPage(0, version);
  }, [loadPage]);

  useFocusEffect(
    useCallback(() => {
      reload();

      return () => {
        requestVersion.current += 1;
        busyRef.current = false;
      };
    }, [reload]),
  );

  function loadMore() {
    if (busyRef.current || !hasMore) return;

    busyRef.current = true;
    setIsLoadingMore(true);
    setError("");

    void loadPage(nextOffsetRef.current, requestVersion.current);
  }

  return (
    <FlatList
      className="mt-[20px] flex-1"
      data={meals}
      keyExtractor={(meal) => meal.id}
      refreshing={isLoading && meals.length > 0}
      onRefresh={reload}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        flexGrow: 1,
        paddingBottom: tabBarHeight + 24,
      }}
      renderItem={({ item }) => (
        <View className="mb-[12px] rounded-[20px] border border-border bg-surface p-[16px]">
          <Text className="font-poppins-semibold text-[15px] text-text">
            {item.mealName}
          </Text>

          <Text className="mt-[6px] font-poppins text-[12px] capitalize text-muted">
            {item.mealCategory}
          </Text>

          <Text className="mt-[6px] font-poppins text-[12px] text-muted">
            {item.servingQuantity}{" "}
            {item.servingQuantity === 1 ? "serving" : "servings"}
          </Text>

          <Text className="mt-[10px] font-poppins-bold text-[18px] text-primary">
            {item.kcal} kcal
          </Text>

          <Text className="mt-[8px] font-poppins text-[11px] text-muted">
            {new Date(item.eatenAt).toLocaleString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      )}
      ListEmptyComponent={
        <View className="items-center py-[32px]">
          {isLoading ? (
            <ActivityIndicator
              color="#0C7762"
              accessibilityLabel="Loading meals"
            />
          ) : !error ? (
            <Text className="text-center font-poppins text-[13px] text-muted">
              No meals logged yet. Add your first meal above.
            </Text>
          ) : null}
        </View>
      }
      ListFooterComponent={
        <View>
          {error ? (
            <Text
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              className="mb-[12px] font-poppins text-[12px] text-[#B93F3F]"
            >
              {error}
            </Text>
          ) : null}

          {hasMore || error ? (
            <Pressable
              onPress={error && !hasMore ? reload : loadMore}
              disabled={isLoading || isLoadingMore}
              accessibilityRole="button"
              accessibilityState={{
                disabled: isLoading || isLoadingMore,
                busy: isLoadingMore,
              }}
              className="min-h-[48px] items-center justify-center rounded-[14px] border border-primary px-[16px]"
            >
              <Text className="font-poppins-semibold text-[13px] text-primary">
                {isLoadingMore
                  ? "Loading..."
                  : error
                    ? "Try again"
                    : "Load more"}
              </Text>
            </Pressable>
          ) : null}
        </View>
      }
    />
  );
}