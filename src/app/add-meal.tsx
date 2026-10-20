import { MealLogForm } from "@/components/meal-log-form";
import { ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddMealScreen() {
  return (
    <SafeAreaView
      edges={["left", "right", "bottom"]}
      className="flex-1 bg-background"
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerClassName="grow w-full max-w-[480px] self-center px-[20px] py-[24px]"
      >
        <Text
          accessibilityRole="header"
          className="font-poppins-bold text-[24px] text-text"
        >
          Log a meal
        </Text>

        <Text className="mt-[8px] font-poppins text-[13px] leading-[21px] text-muted">
          Record the portion you ate and its total calories.
        </Text>

        <MealLogForm />
      </ScrollView>
    </SafeAreaView>
  );
}