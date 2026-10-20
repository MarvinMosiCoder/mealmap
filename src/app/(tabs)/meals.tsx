import { MealLogList } from "@/components/meal-log-list";
import { useAuth } from "@/providers/auth-provider";
import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MealsScreen() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-background"
    >
      <View className="flex-1 w-full max-w-[480px] self-center px-[20px] pt-[24px]">
        <Text
          accessibilityRole="header"
          className="font-poppins-bold text-[28px] text-text"
        >
          Your meals
        </Text>

        <Link href="/add-meal" asChild>
          <Pressable
            accessibilityRole="button"
            className="mt-[24px] min-h-[54px] items-center justify-center rounded-[16px] bg-primary px-[20px] active:opacity-80"
          >
            <Text className="font-poppins-semibold text-[14px] text-white">
              Add meal
            </Text>
          </Pressable>
        </Link>

        <Text className="mt-[12px] font-poppins text-[11px] text-muted">
          Times use your device timezone.
        </Text>

        <MealLogList key={user.id} />
      </View>
    </SafeAreaView>
  );
}