import { Image } from "expo-image";
import { cssInterop } from "nativewind";
import { Text, View } from "react-native";

const StyledImage = cssInterop(Image, { className: "style" });

const meals = [
  {
    category: "Breakfast",
    name: "Overnight oats with berries",
    calories: 340,
    image: require("@/assets/images/meals/breakfast.png"),
  },
  {
    category: "Lunch",
    name: "Chicken avocado salad",
    calories: 400,
    image: require("@/assets/images/meals/lunch.png"),
  },
  {
    category: "Dinner",
    name: "Salmon grain bowl",
    calories: 520,
    image: require("@/assets/images/meals/dinner.png"),
  },
];

export function TodaysMeals() {
  return (
    <View className="mb-[24px]">
      <View className="flex-row items-center justify-between mb-[12px]">
        <Text className="font-poppins-bold text-text text-[16px]">
          Today&apos;s meals
        </Text>

        {/* Visual placeholder until you add a plan screen. */}
        <Text className="font-poppins-semibold text-primary text-[11px]">
          See plan
        </Text>
      </View>

      <View className="gap-[10px]">
        {meals.map((meal) => (
          <View
            key={meal.category}
            className="flex-row items-center gap-[12px] min-h-[70px] bg-surface rounded-[24px] p-[12px]"
          >
            <View className="w-[44px] h-[44px] rounded-full overflow-hidden">
              <StyledImage
                source={meal.image}
                className="w-full h-full"
                contentFit="cover"
                accessible={false}
              />
            </View>

            <View className="flex-1 min-w-0">
              <Text className="font-poppins text-muted text-[10px]">
                {meal.category}
              </Text>

              <Text className="font-poppins-semibold text-text text-[12px]">
                {meal.name}
              </Text>
            </View>

            <Text className="font-poppins-semibold text-text text-[12px]">
              {meal.calories}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}