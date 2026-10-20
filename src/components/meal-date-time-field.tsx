import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { Keyboard, Platform, Pressable, Text, View } from "react-native";

type Props = {
  value: Date;
  onChange: (value: Date) => void;
  disabled?: boolean;
};

export function MealDateTimeField({
  value,
  onChange,
  disabled = false,
}: Props) {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  function openAndroidPicker(mode: "date" | "time") {
    if (disabled) return;

    Keyboard.dismiss();

    DateTimePickerAndroid.open({
      value,
      mode,
      display: "default",
      onChange: (event, selectedDate) => {
        if (event.type === "set" && selectedDate) {
          onChange(selectedDate);
        }
      },
    });
  }

  return (
    <View className="mt-[20px]">
      <Text className="mb-[8px] font-poppins-semibold text-[12px] text-text">
        Date and time eaten
      </Text>

      {Platform.OS === "android" ? (
        <View className="gap-[10px]">
          <Pressable
            onPress={() => openAndroidPicker("date")}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel="Change meal date"
            accessibilityState={{ disabled }}
            className="min-h-[54px] justify-center rounded-[14px] border border-border bg-surface px-[14px]"
          >
            <Text className="font-poppins text-[14px] text-text">
              {value.toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => openAndroidPicker("time")}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel="Change meal time"
            accessibilityState={{ disabled }}
            className="min-h-[54px] justify-center rounded-[14px] border border-border bg-surface px-[14px]"
          >
            <Text className="font-poppins text-[14px] text-text">
              {value.toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </Pressable>
        </View>
      ) : Platform.OS === "ios" ? (
        <DateTimePicker
          value={value}
          mode="datetime"
          display="compact"
          disabled={disabled}
          accessibilityLabel="Meal date and time"
          onChange={(event, selectedDate) => {
            if (event.type === "set" && selectedDate) {
              onChange(selectedDate);
            }
          }}
        />
      ) : null}

      <Text className="mt-[8px] font-poppins text-[11px] leading-[18px] text-muted">
        Date and time use your device timezone: {timezone}.
      </Text>
    </View>
  );
}