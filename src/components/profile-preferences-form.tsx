import { ApiError } from "@/lib/auth";
import { getProfilePreferences, updateProfilePreferences } from "@/lib/preferences";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState, useRef } from "react";
import { Picker } from "@react-native-picker/picker";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

const timezoneOptions = [
  { label: "Asia/Manila", value: "Asia/Manila" },
  { label: "Singapore", value: "Asia/Singapore" },
  { label: "Tokyo", value: "Asia/Tokyo" },
  { label: "London", value: "Europe/London" },
  { label: "New York", value: "America/New_York" },
  { label: "Sydney", value: "Australia/Sydney" },
  { label: "UTC", value: "UTC" },
];

type Props = {
    disabled?: boolean;
    onSavingChange: (saving: boolean) => void;
};

export function ProfilePreferencesForm({ disabled = false, onSavingChange, }: Props) {
    const { refreshSession } = useAuth();
    const [goalInput, setGoalInput] = useState("");
    const [timezoneInput, setTimezoneInput] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [retryKey, setRetryKey] = useState(0);

    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const savingRef = useRef(false);
    const mountedRef = useRef(false);
    
    useEffect(() => {
        mountedRef.current = true;

        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        let active = true;

        async function loadPreferences() {
        setIsLoading(true);
        setLoadError("");

        try {
            const preferences = await getProfilePreferences();

            if (!active) return;

            setGoalInput(
            preferences.dailyCalorieGoalKcal === null
                ? ""
                : String(preferences.dailyCalorieGoalKcal),
            );

            setTimezoneInput(preferences.timezone ?? "");
        } catch (error) {
            if (!active) return;

            setLoadError(
            error instanceof Error
                ? error.message
                : "Could not load your preferences.",
            );

            if (error instanceof ApiError && error.status === 401) {
            void refreshSession(false);
            }
        } finally {
            if (active) {
            setIsLoading(false);
            }
        }
        }

        void loadPreferences();

        return () => {
        active = false;
        };
    }, [refreshSession, retryKey]);

    async function handleSave() {
        if (disabled || isLoading || loadError || savingRef.current) return;

        setSaveError("");
        setSuccessMessage("");

        const goalText = goalInput.trim();
        const goal = goalText === "" ? null : Number(goalText);
        const timezone = timezoneInput.trim() || null;

        if (
            goal !== null &&
            (!/^\d+$/.test(goalText) ||
            !Number.isInteger(goal) ||
            goal <= 0 ||
            goal > 2147483647)
        ) {
            setSaveError(
            "Enter a positive whole number for your calorie goal, or leave it blank.",
            );
            return;
        }

        if (timezone !== null && timezone.length > 255) {
            setSaveError("Timezone must contain 255 characters or fewer.");
            return;
        }

        savingRef.current = true;
        setIsSaving(true);
        onSavingChange(true);

        try {
            Keyboard.dismiss();

            const preferences = await updateProfilePreferences({
                dailyCalorieGoalKcal: goal,
                timezone,
            });

            if (!mountedRef.current) return;

            setGoalInput(
            preferences.dailyCalorieGoalKcal === null
                ? ""
                : String(preferences.dailyCalorieGoalKcal),
            );
            setTimezoneInput(preferences.timezone ?? "");
            setSuccessMessage("Preferences saved.");
        } catch (error) {
            if (!mountedRef.current) return;

            setSaveError(
            error instanceof Error
                ? error.message
                : "Could not save your preferences. Try again.",
            );

            if (error instanceof ApiError && error.status === 401) {
            void refreshSession(false);
            }
        } finally {
            savingRef.current = false;
            onSavingChange(false);

            if (mountedRef.current) {
            setIsSaving(false);
            }
        }
    }

    return (
        <View className="mt-[24px] rounded-[24px] border border-border bg-surface p-[20px]">
        <Text
            className="font-poppins-bold text-[16px] text-text"
            accessibilityRole="header"
        >
            Your preferences
        </Text>

        {isLoading ? (
            <View className="items-center py-[24px]">
            <ActivityIndicator
                color="#0C7762"
                accessibilityLabel="Loading preferences"
            />
            </View>
        ) : loadError ? (
            <View className="mt-[14px]">
            <Text
                className="font-poppins text-[12px] text-[#B93F3F]"
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
            >
                {loadError}
            </Text>

            <Pressable
                onPress={() => setRetryKey((value) => value + 1)}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityState={{ disabled }}
                className="mt-[12px] min-h-[48px] items-center justify-center rounded-[14px] bg-primary"
            >
                <Text className="font-poppins-semibold text-[13px] text-white">
                Try again
                </Text>
            </Pressable>
            </View>
        ) : (
            <View>
                <Text className="mb-[8px] mt-[18px] font-poppins-semibold text-[12px] text-text">
                    Daily calorie goal (kcal)
                </Text>

                <TextInput
                    value={goalInput}
                    onChangeText={(value) => {
                        setGoalInput(value);
                        setSaveError("");
                        setSuccessMessage("");
                    }}
                    editable={!disabled && !isSaving}
                    keyboardType="number-pad"
                    placeholder="Not set"
                    placeholderTextColor="#6D8580"
                    accessibilityLabel="Daily calorie goal in kilocalories"
                    className="min-h-[54px] rounded-[14px] border border-border bg-background px-[14px] font-poppins text-[14px] text-text"
                />

                <Text className="mb-[8px] mt-[18px] font-poppins-semibold text-[12px] text-text">
                    Timezone
                </Text>

                <View
                    pointerEvents={disabled || isSaving ? "none" : "auto"}
                    className={`min-h-[54px] overflow-hidden rounded-[14px] border border-border bg-background ${
                        disabled || isSaving ? "opacity-60" : ""
                    }`}
                >
                <Picker
                    selectedValue={timezoneInput}
                    enabled={!disabled && !isSaving}
                    mode="dropdown"
                    dropdownIconColor="#0C7762"
                    accessibilityLabel="Timezone"
                    accessibilityState={{ disabled: disabled || isSaving }}
                    style={{ color: "#173B35" }}
                    itemStyle={{ fontSize: 14, color: "#173B35" }}
                    onValueChange={(value) => {
                    if (disabled || savingRef.current) return;

                    setTimezoneInput(String(value));
                    setSaveError("");
                    setSuccessMessage("");
                    }}
                >
                    <Picker.Item label="Not set — clear timezone" value="" />

                    {timezoneInput !== "" &&
                    !timezoneOptions.some((option) => option.value === timezoneInput) ? (
                    <Picker.Item label={timezoneInput} value={timezoneInput} />
                    ) : null}

                    {timezoneOptions.map((option) => (
                    <Picker.Item
                        key={option.value}
                        label={option.label}
                        value={option.value}
                    />
                    ))}
                </Picker>
                </View>

                <Text className="mt-[10px] font-poppins text-[11px] leading-[18px] text-muted">
                    Leave a field blank to clear its saved value.
                </Text>

                {saveError ? (
                <Text
                    className="mt-[14px] font-poppins text-[12px] text-[#B93F3F]"
                    accessibilityRole="alert"
                    accessibilityLiveRegion="polite"
                >
                    {saveError}
                </Text>
                ) : null}

                {successMessage ? (
                <Text
                    className="mt-[14px] font-poppins text-[12px] text-primary"
                    accessibilityLiveRegion="polite"
                >
                    {successMessage}
                </Text>
                ) : null}

                <Pressable
                    onPress={handleSave}
                    disabled={disabled || isSaving}
                    accessibilityRole="button"
                    accessibilityLabel={isSaving ? "Saving preferences" : "Save preferences"}
                    accessibilityState={{
                        disabled: disabled || isSaving,
                        busy: isSaving,
                    }}
                    className={`mt-[18px] min-h-[54px] flex-row items-center justify-center gap-[10px] rounded-[16px] bg-primary px-[18px] ${
                        disabled || isSaving ? "opacity-60" : "active:opacity-80"
                    }`}
                    >
                    {isSaving ? <ActivityIndicator color="#FFFFFF" /> : null}

                    <Text className="font-poppins-semibold text-[14px] text-white">
                        {isSaving ? "Saving..." : "Save preferences"}
                    </Text>
                </Pressable>
            </View>
        )}
        </View>
    );
}