import { useAuth } from "@/providers/auth-provider";
import { loginThemes } from "@/styles/login-theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, router } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function LoginContent() {
  const { signIn } = useAuth();
  const mode = useColorScheme() === "dark" ? "dark" : "light";
  const theme = loginThemes[mode];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<"email" | "password" | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");
  const submitting = useRef(false);
  const passwordInput = useRef<TextInput>(null);

  async function handleLogin() {
    if (submitting.current) return;

    setErrorMessage("");
    setNotice("");

    if (!email.trim() || !password) {
      setErrorMessage("Enter your email and password.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage("Enter a valid email address.");
      return;
    }

    submitting.current = true;
    setIsSubmitting(true);

    try {
      await signIn(email.trim(), password);
      setPassword("");
      setShowPassword(false);
      router.replace("/");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Login failed. Try again.");
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  }

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  }

  function handleSocialLogin(provider: "Google" | "Apple") {
    setErrorMessage("");
    setNotice(`${provider} login is not available yet. Use your email and password.`);
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.background }}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="grow w-full max-w-[480px] self-center px-[20px] pt-[12px] pb-[24px]"
        >
          <View className="mb-[22px] flex-row items-center justify-between gap-[12px]">
            <Pressable
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              className="h-[44px] w-[44px] items-center justify-center rounded-full border active:opacity-60"
              style={{ backgroundColor: theme.surface, borderColor: theme.border }}
            >
              <Ionicons name="arrow-back" size={21} color={theme.text} accessible={false} />
            </Pressable>
            <View className="min-w-0 flex-1 flex-row items-center justify-center">
              <Image
                source={require("@/assets/images/system/mealmap.png")}
                className="h-[34px] w-[34px]"
                resizeMode="contain"
                accessible={false}
              />
              <Text
                className="shrink font-poppins-semibold text-[21px] mt-[4px] tracking-[-1px]"
                style={{ color: theme.text }}
                numberOfLines={1}
                adjustsFontSizeToFit
                accessibilityLabel="MealMap"
              >
                Meal<Text style={{ color: theme.primary }}>Map</Text>
              </Text>
            </View>
            <View className="w-[44px]" />
          </View>

          <View className="relative overflow-hidden rounded-[28px] bg-[#E1F0E6] p-[20px] dark:bg-[#193E32]">
            <View pointerEvents="none" className="absolute -right-[32px] -top-[55px] h-[170px] w-[170px] rounded-full bg-white/25" />
            <View className="mb-[12px] flex-row items-center gap-[6px]">
              <Ionicons name="leaf-outline" size={14} color={theme.primary} accessible={false} />
              <Text className="font-poppins-semibold text-[9px] uppercase tracking-[1.1px]" style={{ color: theme.primary }}>
                A little balance, every day
              </Text>
            </View>
            <View className="flex-row items-center gap-[12px]">
              <View className="min-w-0 flex-1">
                <Text className="font-poppins-bold text-[29px] leading-[36px] tracking-[-0.8px]" style={{ color: theme.text }}>
                  Good food.{"\n"}Better days.
                </Text>
              </View>
              <View className="h-[90px] w-[90px] overflow-hidden rounded-full border-[5px] border-white/60">
                <Image
                  source={require("@/assets/images/meals/lunch.png")}
                  className="h-full w-full"
                  resizeMode="cover"
                  accessible={false}
                />
              </View>
            </View>
          </View>

          <View className="mb-[18px] mt-[24px]">
            <Text className="font-poppins-bold text-[27px] tracking-[-0.8px]" style={{ color: theme.text }} accessibilityRole="header">
              Welcome back.
            </Text>
            <Text className="mt-[5px] font-poppins text-[12px] leading-[20px]" style={{ color: theme.muted }}>
              Your next good habit starts with a meal.
            </Text>
          </View>

          <View className="rounded-[26px] border p-[20px]" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
            <Text className="mb-[8px] font-poppins-semibold text-[12px]" style={{ color: theme.text }}>Email address</Text>
            <View
              className="min-h-[56px] flex-row items-center gap-[11px] rounded-[16px] border px-[14px]"
              style={{ backgroundColor: theme.background, borderColor: focusedField === "email" ? theme.primary : theme.border }}
            >
              <Ionicons name="mail-outline" size={19} color={focusedField === "email" ? theme.primary : theme.muted} accessible={false} />
              <TextInput
                className="min-h-[54px] min-w-0 flex-1 py-[12px] font-poppins text-[13px]"
                style={{ color: theme.text }}
                accessibilityLabel="Email address"
                placeholder="you@example.com"
                placeholderTextColor={theme.muted}
                selectionColor={theme.primary}
                value={email}
                onChangeText={setEmail}
                editable={!isSubmitting}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                underlineColorAndroid="transparent"
                returnKeyType="next"
                onSubmitEditing={() => passwordInput.current?.focus()}
                submitBehavior="submit"
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <Text className="mb-[8px] mt-[18px] font-poppins-semibold text-[12px]" style={{ color: theme.text }}>Password</Text>
            <View
              className="min-h-[56px] flex-row items-center gap-[11px] rounded-[16px] border pl-[14px] pr-[4px]"
              style={{ backgroundColor: theme.background, borderColor: focusedField === "password" ? theme.primary : theme.border }}
            >
              <Ionicons name="lock-closed-outline" size={19} color={focusedField === "password" ? theme.primary : theme.muted} accessible={false} />
              <TextInput
                ref={passwordInput}
                className="min-h-[54px] min-w-0 flex-1 py-[12px] font-poppins text-[13px]"
                style={{ color: theme.text }}
                accessibilityLabel="Password"
                placeholder="Enter your password"
                placeholderTextColor={theme.muted}
                selectionColor={theme.primary}
                value={password}
                onChangeText={setPassword}
                editable={!isSubmitting}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="current-password"
                textContentType="password"
                underlineColorAndroid="transparent"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
              />
              <Pressable
                onPress={() => setShowPassword(value => !value)}
                disabled={isSubmitting}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                accessibilityState={{ disabled: isSubmitting }}
                className="h-[44px] w-[44px] items-center justify-center rounded-full active:opacity-60"
              >
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={theme.muted} accessible={false} />
              </Pressable>
            </View>

            {errorMessage ? (
              <View className="mt-[14px] flex-row items-start gap-[8px]">
                <Ionicons name="alert-circle-outline" size={17} color={theme.error} accessible={false} />
                <Text className="min-w-0 flex-1 font-poppins text-[12px] leading-[19px]" style={{ color: theme.error }} accessibilityRole="alert" accessibilityLiveRegion="polite">
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleLogin}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel={isSubmitting ? "Logging in" : "Log in"}
              accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
              className={`mt-[22px] min-h-[54px] flex-row items-center justify-center gap-[10px] rounded-[17px] px-[18px] py-[14px] active:opacity-80 ${isSubmitting ? "opacity-70" : ""}`}
              style={{ backgroundColor: theme.primary }}
            >
              {isSubmitting ? <ActivityIndicator color={theme.onPrimary} /> : null}
              <Text className="font-poppins-semibold text-[14px]" style={{ color: theme.onPrimary }}>
                {isSubmitting ? "Logging in..." : "Log in"}
              </Text>
              {!isSubmitting ? <Ionicons name="arrow-forward" size={18} color={theme.onPrimary} accessible={false} /> : null}
            </Pressable>
          </View>

          <View className="mb-[16px] mt-[24px] flex-row items-center gap-[12px]">
            <View className="h-[1px] flex-1" style={{ backgroundColor: theme.border }} />
            <Text className="font-poppins text-[11px]" style={{ color: theme.muted }}>Or continue with</Text>
            <View className="h-[1px] flex-1" style={{ backgroundColor: theme.border }} />
          </View>
          <View className="flex-row gap-[12px]">
            <Pressable
              onPress={() => handleSocialLogin("Google")}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Continue with Google"
              accessibilityState={{ disabled: isSubmitting }}
              className="min-h-[52px] flex-1 flex-row items-center justify-center gap-[9px] rounded-[17px] border px-[12px] py-[12px] active:opacity-70"
              style={{ backgroundColor: theme.surface, borderColor: theme.border }}
            >
              <Image source={{ uri: "https://developers.google.com/static/identity/images/g-logo.png" }} className="h-[18px] w-[18px]" resizeMode="contain" accessible={false} />
              <Text className="font-poppins-semibold text-[12px]" style={{ color: theme.text }}>Google</Text>
            </Pressable>
            <Pressable
              onPress={() => handleSocialLogin("Apple")}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Continue with Apple"
              accessibilityState={{ disabled: isSubmitting }}
              className="min-h-[52px] flex-1 flex-row items-center justify-center gap-[9px] rounded-[17px] border px-[12px] py-[12px] active:opacity-70"
              style={{ backgroundColor: theme.surface, borderColor: theme.border }}
            >
              <Ionicons name="logo-apple" size={21} color={theme.text} accessible={false} />
              <Text className="font-poppins-semibold text-[12px]" style={{ color: theme.text }}>Apple</Text>
            </Pressable>
          </View>

          {notice ? (
            <Text className="mt-[12px] text-center font-poppins text-[12px] leading-[19px]" style={{ color: theme.muted }} accessibilityLiveRegion="polite">{notice}</Text>
          ) : null}

          <Link href="/" replace asChild>
            <Pressable accessibilityRole="button" accessibilityLabel="Explore meals without logging in" className="mt-[14px] min-h-[44px] items-center justify-center px-[12px] py-[12px] active:opacity-70">
              <Text className="text-center font-poppins text-[12px]" style={{ color: theme.muted }}>
                Just looking around? <Text className="font-poppins-semibold" style={{ color: theme.primary }}>Explore meals</Text>
              </Text>
            </Pressable>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
