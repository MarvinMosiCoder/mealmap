import { Image, Pressable, Text, View } from "react-native";

const categories = [
  {
    id: "breakfast",
    label: "Breakfast",
    image: require("@/assets/images/meals/breakfast.png"),
    backgroundColor: "#FFF3D8",
  },
  {
    id: "lunch",
    label: "Lunch",
    image: require("@/assets/images/meals/lunch.png"),
    backgroundColor: "#E0F1E8",
  },
  {
    id: "dinner",
    label: "Dinner",
    image: require("@/assets/images/meals/dinner.png"),
    backgroundColor: "#FBE8E1",
  },
  {
    id: "snacks",
    label: "Snacks",
    image: require("@/assets/images/meals/snacks.png"),
    backgroundColor: "#F7E8F0",
  },
] as const;

export type MealCategory = (typeof categories)[number]["id"];

type ExploreByMealProps = {
  onSelect?: (category: MealCategory) => void;
};

export function ExploreByMeal({ onSelect }: ExploreByMealProps) {
  return (
    <View className="mt-[24px]">
      <Text
        className="font-poppins-bold text-[16px] text-text"
        accessibilityRole="header"
      >
        Explore by meal
      </Text>
      <Text className="mt-[4px] mb-[14px] font-poppins text-[12px] leading-[18px] text-muted">
        A little inspiration for every appetite.
      </Text>

      <View className="flex-row gap-[8px]">
        {categories.map((category) => {
          const content = (
            <>
              <Image
                source={category.image}
                className="h-[48px] w-[48px] rounded-full"
                resizeMode="cover"
                accessible={false}
              />
              <Text className="mt-[10px] text-center font-poppins-semibold text-[11px] text-text">
                {category.label}
              </Text>
            </>
          );
          const cardClassName = "min-h-[104px] min-w-0 flex-1 items-center justify-center rounded-[20px] px-[4px] py-[12px]";
          const cardStyle = { backgroundColor: category.backgroundColor };

          return onSelect ? (
            <Pressable
              key={category.id}
              onPress={() => onSelect(category.id)}
              accessibilityRole="button"
              accessibilityLabel={`Explore ${category.label.toLowerCase()}`}
              className={`${cardClassName} active:opacity-70`}
              style={cardStyle}
            >
              {content}
            </Pressable>
          ) : (
            <View key={category.id} className={cardClassName} style={cardStyle}>
              {content}
            </View>
          );
        })}
      </View>
    </View>
  );
}
