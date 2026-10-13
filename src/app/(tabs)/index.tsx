import { FeaturedMealCard } from "@/components/featured-meal-card";
import { NutritionSummary } from "@/components/nutrition-summary";
import { TodaysMeals } from "@/components/todays-meals";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function IndexScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="grow px-[16px] pt-[20px] pb-[24px]">
        <View className="flex-row items-center">
          <Image
            source={require("@/assets/images/system/mealmap.png")}
            className="h-[50px] w-[50px]"
            resizeMode="contain"
          />
          <Text
            className="font-poppins-semibold text-[25px] pt-1 tracking-[-1px] text-[#0F172A] dark:text-[#F2F0EA]"
            accessibilityLabel="MealMap"
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            Meal<Text className="text-[#0F7058] dark:text-[#57CCA7]">Map</Text>
          </Text>
          
        </View>
        <View className="flex-row items-center justify-between mb-[20px]">
          <View className="flex-1 pr-[12px]">
            <Text className="font-poppins-bold text-text text-[20px]">
              Let&apos;s eat well today
            </Text>
          </View>

          {/* Search button appearance; connect its action later. */}
          <View className="w-[44px] h-[44px] rounded-full bg-surface items-center justify-center">
            <Ionicons name="search-outline" size={20} color="#173B35" />
          </View>
        </View>
        <FeaturedMealCard />
        <NutritionSummary />
        <TodaysMeals />
      </ScrollView>
    </SafeAreaView>
  );
}
