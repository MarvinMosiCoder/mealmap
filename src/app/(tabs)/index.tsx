import { useAuth } from "@/providers/auth-provider";
import { FeaturedMealCard } from "@/components/featured-meal-card";
import { TodaysMeals } from "@/components/todays-meals";
import { ExploreByMeal } from "@/components/explore-by-meal";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, router } from "expo-router";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { HomeDailySummary } from "@/components/home-daily-summary";

export default function IndexScreen() {
  const { user } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerClassName="grow px-[16px] pt-[20px] pb-[24px]"
        contentContainerStyle={{
          paddingBottom: user ? tabBarHeight + 24 : 24,
        }}
        >
        {/* Brand and login */}
        <View className="flex-row items-center gap-[12px] mb-[24px]">
          <View className="flex-1 min-w-0 flex-row items-center gap-[2px]">
            <View className="w-[40px] h-[40px] shrink-0 overflow-hidden items-center justify-center">
              <Image
                source={require("@/assets/images/system/mealmap.png")}
                className="w-[64px] h-[64px] shrink-0"
                resizeMode="contain"
                accessible={false}
              />
            </View>

            <Text
              className="flex-shrink font-poppins-semibold text-[24px] tracking-[-1px] mt-[5px] text-[#0F172A]"
              numberOfLines={1}
              adjustsFontSizeToFit
              accessibilityLabel="MealMap"
            >
              Meal<Text className="text-primary">Map</Text>
            </Text>
          </View>
          {
            user ? (
              <View><Text className="font-poppins-semibold text-[13px] text-[#0F172A]"><Ionicons name="notifications-outline" size={25} /></Text></View>) 
            :
            (
              <Link href="/login" asChild>
                <Pressable
                  className="shrink-0 p-2.5 rounded-full bg-primary items-center justify-center active:opacity-80"
                  accessibilityRole="button"
                >
                  <Text className="font-poppins-semibold text-white text-[13px]">
                    <Ionicons name="person-outline" size={19} />
                  </Text>
                </Pressable>
              </Link>
            )
          }
        </View>

        {/* Greeting and search appearance */}
        <View className="flex-row items-center gap-[16px] mb-[24px]">
          <View className="flex-1 min-w-0">
            <Text className="font-poppins-bold text-text text-[22px] leading-[30px] tracking-[-0.5px]">
              Let&apos;s eat well today
            </Text>

            <Text className="mt-[4px] font-poppins text-muted text-[12px] leading-[18px]">
              Small steps. Better meals.
            </Text>
          </View>

          <View className="shrink-0 w-[44px] h-[44px] rounded-full bg-surface border border-border items-center justify-center">
            <Ionicons name="search-outline" size={21} color="#173B35" />
          </View>
        </View>
        <FeaturedMealCard />
        {
          user ? (
            <>
              <HomeDailySummary key={user.id} />
              <TodaysMeals />
            </>
          ) : (
            <>
              <View className="mt-[20px] rounded-[24px] bg-surface p-[20px]">
                <View className="w-[48px] h-[48px] rounded-full bg-background items-center justify-center">
                  <Ionicons name="leaf-outline" size={24} color="#0C7762" />
                </View>

                <Text className="mt-[14px] font-poppins-bold text-[20px] text-text">
                  Make room for healthier habits
                </Text>

                <Text className="mt-[8px] font-poppins text-[14px] leading-[22px] text-muted">
                  Log in to plan your meals and keep track of your daily nutrition.
                </Text>

                <Link href="/login" asChild>
                  <Pressable
                    className="mt-[18px] min-h-[48px] rounded-[16px] bg-primary items-center justify-center active:opacity-80"
                    accessibilityRole="button"
                  >
                    <Text className="font-poppins-semibold text-[14px] text-white">
                      Get Started
                    </Text>
                  </Pressable>
                </Link>
              </View>
              <ExploreByMeal
                onSelect={category =>
                  router.push({
                    pathname: "/meal-category/[category]",
                    params: { category },
                  })
                }
              />
            </>
          )
        }
      </ScrollView>
    </SafeAreaView>
  );
}
