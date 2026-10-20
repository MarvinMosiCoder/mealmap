import { MealDateTimeField } from "@/components/meal-date-time-field";
import { ApiError } from "@/lib/auth";
import { createMealLog, type MealCategory } from "@/lib/meal-logs";
import { useAuth } from "@/providers/auth-provider";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

export function MealLogForm() {
  const { refreshSession } = useAuth();
  const [mealName, setMealName] = useState("");
  const [mealCategory, setMealCategory] = useState<MealCategory | "">("");
  const [quantityInput, setQuantityInput] = useState("");
  const [kcalInput, setKcalInput] = useState("");
  const [eatenAt, setEatenAt] = useState(() => new Date());

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const saveLockedRef = useRef(false);
  const mountedRef = useRef(true);

  const isLocked = isSaving || isSaved;

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function handleSave() {
    if (saveLockedRef.current) return;

    Keyboard.dismiss();
    setSaveError("");

    const name = mealName.trim();

    if (
      !name ||
      [...name].length > 200 ||
      name.includes("\u0000")
    ) {
      setSaveError("Enter a meal name between 1 and 200 characters.");
      return;
    }

    if (mealCategory === "") {
      setSaveError("Choose a meal category.");
      return;
    }

    const quantityText = quantityInput.trim().replace(",", ".");
    const servingQuantity = Number(quantityText);

    if (
      !/^(?:\d+(?:\.\d{0,3})?|\.\d{1,3})$/.test(quantityText) ||
      !Number.isFinite(servingQuantity) ||
      servingQuantity <= 0 ||
      servingQuantity > 9999999.999
    ) {
      setSaveError(
        "Enter servings between 0.001 and 9999999.999, with at most 3 decimal places.",
      );
      return;
    }

    const kcalText = kcalInput.trim();
    const kcal = Number(kcalText);

    if (
      !/^\d+$/.test(kcalText) ||
      !Number.isInteger(kcal) ||
      kcal < 0 ||
      kcal > 2147483647
    ) {
      setSaveError(
        "Enter total kcal as a whole number between 0 and 2147483647.",
      );
      return;
    }

    if (
      !Number.isFinite(eatenAt.getTime()) ||
      eatenAt.getUTCFullYear() < 0 ||
      eatenAt.getUTCFullYear() > 9999
    ) {
      setSaveError("Choose a valid meal date and time.");
      return;
    }

    saveLockedRef.current = true;
    setIsSaving(true);

    try {
      await createMealLog({
        mealName: name,
        mealCategory,
        servingQuantity,
        kcal,
        eatenAt: eatenAt.toISOString(),
      });

      if (mountedRef.current) {
        setIsSaved(true);
      }
    } catch (error) {
      saveLockedRef.current = false;

      if (!mountedRef.current) return;

      setSaveError(
        error instanceof Error
          ? error.message
          : "Could not save your meal. Try again.",
      );

      if (error instanceof ApiError && error.status === 401) {
        void refreshSession(false);
      }
    } finally {
      if (mountedRef.current) {
        setIsSaving(false);
      }
    }
  }

  return (
    <View className="mt-[24px]">
      <Text className="mb-[8px] font-poppins-semibold text-[12px] text-text">
        Meal name
      </Text>

      <TextInput
        editable={!isLocked}
        value={mealName}
        onChangeText={setMealName}
        placeholder="Chicken and rice"
        placeholderTextColor="#6D8580"
        maxLength={200}
        accessibilityLabel="Meal name"
        className="min-h-[54px] rounded-[14px] border border-border bg-surface px-[14px] font-poppins text-[14px] text-text"
      />

      <Text className="mb-[8px] mt-[20px] font-poppins-semibold text-[12px] text-text">
        Meal category
      </Text>

      <View 
        pointerEvents={isLocked ? "none" : "auto"}
        className="overflow-hidden rounded-[14px] border border-border bg-surface"
      >
        <Picker<MealCategory | "">
          selectedValue={mealCategory}
          onValueChange={(value) => setMealCategory(value)}
          mode="dropdown"
          dropdownIconColor="#0C7762"
          accessibilityLabel="Meal category"
          style={{ color: "#173B35" }}
          itemStyle={{ fontSize: 14, color: "#173B35" }}
          enabled={!isLocked}
          accessibilityState={{ disabled: isLocked }}
        >
          <Picker.Item label="Choose a category" value="" />
          <Picker.Item label="Breakfast" value="breakfast" />
          <Picker.Item label="Lunch" value="lunch" />
          <Picker.Item label="Dinner" value="dinner" />
          <Picker.Item label="Snacks" value="snacks" />
        </Picker>
      </View>

      <Text className="mb-[8px] mt-[20px] font-poppins-semibold text-[12px] text-text">
        Servings eaten
      </Text>

      <TextInput
        editable={!isLocked}
        value={quantityInput}
        onChangeText={setQuantityInput}
        keyboardType="decimal-pad"
        placeholder="For example, 1.5"
        placeholderTextColor="#6D8580"
        accessibilityLabel="Number of servings eaten"
        className="min-h-[54px] rounded-[14px] border border-border bg-surface px-[14px] font-poppins text-[14px] text-text"
      />

      <Text className="mt-[8px] font-poppins text-[11px] leading-[18px] text-muted">
        Enter the number of servings you actually ate.
      </Text>

      <Text className="mb-[8px] mt-[20px] font-poppins-semibold text-[12px] text-text">
        Total calories eaten (kcal)
      </Text>

      <TextInput
        editable={!isLocked}
        value={kcalInput}
        onChangeText={setKcalInput}
        keyboardType="number-pad"
        placeholder="Enter total kcal"
        placeholderTextColor="#6D8580"
        accessibilityLabel="Total calories eaten in kilocalories"
        className="min-h-[54px] rounded-[14px] border border-border bg-surface px-[14px] font-poppins text-[14px] text-text"
      />

      <Text className="mt-[8px] font-poppins text-[11px] leading-[18px] text-muted">
        Include calories for the entire portion. For two servings at
        250 kcal each, enter 500.
      </Text>
      <MealDateTimeField value={eatenAt} onChange={setEatenAt} disabled={isLocked}/>
      {saveError ? (
        <Text
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          className="mt-[16px] font-poppins text-[12px] text-[#B93F3F]"
        >
          {saveError}
        </Text>
      ) : null}

      {isSaved ? (
        <Text
          accessibilityLiveRegion="polite"
          className="mt-[16px] font-poppins-semibold text-[13px] text-primary"
        >
          Meal saved.
        </Text>
      ) : null}

      <Pressable
        onPress={handleSave}
        disabled={isLocked}
        accessibilityRole="button"
        accessibilityLabel={
          isSaving ? "Saving meal" : isSaved ? "Meal saved" : "Save meal"
        }
        accessibilityState={{
          disabled: isLocked,
          busy: isSaving,
        }}
        className={`mt-[20px] min-h-[54px] flex-row items-center justify-center gap-[10px] rounded-[16px] bg-primary px-[20px] ${
          isLocked ? "opacity-60" : "active:opacity-80"
        }`}
      >
        {isSaving ? <ActivityIndicator color="#FFFFFF" /> : null}

        <Text className="font-poppins-semibold text-[14px] text-white">
          {isSaving ? "Saving..." : isSaved ? "Saved" : "Save meal"}
        </Text>
      </Pressable>
    </View>
  );
}