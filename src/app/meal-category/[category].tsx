import { MealCategoryContent } from "@/components/meal-category-content";
import { mealCategories } from "@/data/meal-categories";
import { Redirect, Stack, useLocalSearchParams } from "expo-router";

export default function MealCategoryScreen() {
  const { category } = useLocalSearchParams<{ category?: string }>();
  const details = mealCategories.find(item => item.id === category);

  if (!details) return <Redirect href="/" />;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <MealCategoryContent details={details} />
    </>
  );
}
