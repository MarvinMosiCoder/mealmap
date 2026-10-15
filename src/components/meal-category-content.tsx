import { mealCategories } from "@/data/meal-categories";
import { useAuth } from "@/providers/auth-provider";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, router } from "expo-router";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type MealCategoryContentProps = {
  details: (typeof mealCategories)[number];
};

export function MealCategoryContent({ details }: MealCategoryContentProps) {
  const { user } = useAuth();

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="grow w-full max-w-[480px] self-center px-[20px] pt-[12px] pb-[28px]"
      >
        <View className="mb-[24px] flex-row items-center justify-between gap-[12px]">
          <Pressable
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="h-[44px] w-[44px] items-center justify-center rounded-full border border-border bg-surface active:opacity-60"
          >
            <Ionicons name="arrow-back" size={21} color="#173B35" accessible={false} />
          </Pressable>
          <Text className="font-poppins-semibold text-[15px] text-text">
            Meal inspiration
          </Text>
          <View className="h-[44px] w-[44px] items-center justify-center">
            <Ionicons name="leaf-outline" size={23} color="#0C7762" accessible={false} />
          </View>
        </View>

        <View
          className="relative overflow-hidden rounded-[28px] p-[22px]"
          style={{ backgroundColor: details.backgroundColor }}
        >
          <View pointerEvents="none" className="absolute -right-[38px] -top-[50px] h-[180px] w-[180px] rounded-full bg-white/30" />
          <View className="flex-row items-center gap-[7px]">
            <Ionicons name={details.icon} size={17} color={details.accentColor} accessible={false} />
            <Text className="flex-1 font-poppins-semibold text-[10px] uppercase tracking-[1.3px]" style={{ color: details.accentColor }}>
              {details.eyebrow}
            </Text>
          </View>
          <Text className="mt-[15px] font-poppins-bold text-[34px] leading-[44px] tracking-[-1px] text-text" accessibilityRole="header">
            {details.title}
          </Text>
          <View className="mt-[7px] flex-row items-center gap-[12px]">
            <View className="min-w-0 flex-1">
              <Text className="font-poppins text-[13px] leading-[21px] text-[#527066]">
                {details.description}
              </Text>
              <View className="mt-[16px] flex-row items-center gap-[6px]">
                <Ionicons name="restaurant-outline" size={14} color={details.accentColor} accessible={false} />
                <Text className="font-poppins-semibold text-[11px]" style={{ color: details.accentColor }}>
                  {details.meals.length} meal ideas
                </Text>
              </View>
            </View>
            <View className="h-[104px] w-[104px] items-center justify-center overflow-hidden rounded-full border-[5px] border-white/60 bg-white/40">
              <Image source={details.image} className="h-full w-full" resizeMode="cover" accessible={false} />
            </View>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-[22px] grow-0"
          contentContainerClassName="gap-[8px] pb-[4px]"
        >
          {mealCategories.map(item => {
            const isSelected = item.id === details.id;

            return (
              <Link
                key={item.id}
                href={{ pathname: "/meal-category/[category]", params: { category: item.id } }}
                replace
                asChild
              >
                <Pressable
                  disabled={isSelected}
                  accessibilityRole="button"
                  accessibilityLabel={`Browse ${item.title.toLowerCase()}`}
                  accessibilityState={{ selected: isSelected, disabled: isSelected }}
                  className={`min-h-[44px] items-center justify-center rounded-full border px-[17px] py-[10px] active:opacity-70 ${isSelected ? "border-primary bg-primary" : "border-border bg-surface"}`}
                >
                  <Text className={`font-poppins-semibold text-[12px] ${isSelected ? "text-white" : "text-muted"}`}>
                    {item.title}
                  </Text>
                </Pressable>
              </Link>
            );
          })}
        </ScrollView>

        <View className="mb-[14px] mt-[24px] flex-row items-center justify-between gap-[12px]">
          <Text className="flex-1 font-poppins-bold text-[19px] tracking-[-0.3px] text-text" accessibilityRole="header">
            A little inspiration
          </Text>
          <Text className="font-poppins text-[11px] text-muted">For your table</Text>
        </View>

        <View className="gap-[12px]">
          {details.meals.map((meal, index) => (
            <View key={meal} className="flex-row items-center gap-[14px] rounded-[24px] border border-border bg-surface p-[16px]">
              <View className="h-[64px] w-[64px] items-center justify-center rounded-[20px]" style={{ backgroundColor: details.backgroundColor }}>
                <Ionicons name={index === 0 ? "restaurant-outline" : "leaf-outline"} size={28} color={details.accentColor} accessible={false} />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="mb-[5px] font-poppins-semibold text-[9px] uppercase tracking-[1.5px] text-muted">
                  Meal idea {String(index + 1).padStart(2, "0")}
                </Text>
                <Text className="font-poppins-semibold text-[14px] leading-[22px] text-text">{meal}</Text>
              </View>
            </View>
          ))}
        </View>

        <View className="mt-[22px] flex-row items-start gap-[11px] rounded-[22px] bg-[#E5F0E9] p-[18px]">
          <Ionicons name="sparkles-outline" size={21} color="#0C7762" accessible={false} />
          <View className="min-w-0 flex-1">
            <Text className="font-poppins-semibold text-[12px] text-text">One small step</Text>
            <Text className="mt-[5px] font-poppins text-[12px] leading-[20px] text-[#527568]">{details.tip}</Text>
          </View>
        </View>

        <View className="mt-[24px] rounded-[26px] bg-primary p-[22px]">
          <Text className="font-poppins-bold text-[19px] leading-[28px] text-white">Make room for good food.</Text>
          <Text className="mt-[7px] font-poppins text-[12px] leading-[20px] text-white/90">
            {user ? "Take a little inspiration into your weekly routine." : "Log in to start planning your meals and building your routine."}
          </Text>
          <Link href={user ? "/plan" : "/login"} asChild>
            <Pressable
              accessibilityRole="button"
              className="mt-[18px] min-h-[48px] flex-row items-center justify-center gap-[10px] rounded-[16px] bg-white px-[16px] py-[12px] active:opacity-80"
            >
              <Text className="font-poppins-semibold text-[13px] text-primary">
                {user ? "Open my plan" : "Log in to get started"}
              </Text>
              <Ionicons name="arrow-forward" size={17} color="#0C7762" accessible={false} />
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
