import { MealLogList } from "@/components/meal-log-list";
import { useAuth } from "@/providers/auth-provider";
import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function MealsScreen() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-background"
    >
      <View className="flex-1 w-full max-w-[480px] self-center px-[20px] pt-[24px]">

        {/* Header */}
        <View className="flex-row items-center justify-between gap-[16px]">
          <View className="flex-1">
            <Text className="font-poppins-bold text-[28px] tracking-[-0.8px] text-text" accessibilityRole="header">
              Your Meals
            </Text>
          </View>
          <View className="h-[46px] w-[46px] items-center justify-center rounded-full border border-border bg-surface">
            <Ionicons name="leaf-outline" size={23} color="#0C7762" accessible={false} />
          </View>
        </View>

        <Text className="mt-[12px] font-poppins text-[11px] text-muted">
          Times use your device timezone.
        </Text>

        {/* Scrollable meal list */}
        <View className="flex-1 mt-[16px]">
          <MealLogList key={user.id} />
        </View>

        {/* Fixed bottom button */}
        <View className="mb-[100px]">
          <Link href="/add-meal" asChild>
            <Pressable
              accessibilityRole="button"
              className="min-h-[54px] items-center justify-center rounded-[16px] bg-primary px-[20px] active:opacity-80"
            >
              <Text className="font-poppins-semibold text-[14px] text-white">
                Add meal
              </Text>
            </Pressable>
          </Link>
        </View>

      </View>
    </SafeAreaView>
  );
}