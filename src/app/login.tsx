import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, router } from "expo-router";
import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const passwordInput = useRef<TextInput>(null);

  function handleLogin() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || !password) {
      setError("Enter your email and password to continue.");
      return;
    }
    // UI preview only. Connect your authentication request here.
    setError("");
    router.replace("/");
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerClassName="grow px-[28px] pt-[12px] pb-[24px]">
          <View className="flex-row items-center justify-between">
            <Link href="/" asChild>
              <Pressable className="w-[44px] h-[44px] rounded-full items-center justify-center bg-[#F5F5EF] active:opacity-80" accessibilityRole="button" accessibilityLabel="Back to daily log">
                <Ionicons name="arrow-back" size={22} color="#232829" />
              </Pressable>
            </Link>
            <Text className="text-text font-poppins-bold text-[18px] tracking-[-0.5px]">Meal Map</Text>
            <View className="w-[44px]" />
          </View>

          <View className="h-[164px] items-center justify-center mt-[24px]">
            <View className="absolute w-[50px] h-[50px] rounded-full bg-[#B9E9DA] top-[15px] right-[18%]" />
            <View className="absolute w-[30px] h-[30px] rounded-full bg-[#F7E3A0] bottom-[17px] left-[19%]" />
            <View className="w-[108px] h-[108px] rounded-[38px] bg-[#FFF0ED] items-center justify-center -rotate-[8deg]"><Ionicons name="restaurant" size={46} color="#FF5149" /></View>
          </View>

          <Text className="text-text font-poppins-bold text-[31px] tracking-[-1.1px] text-center mt-[7px]">Welcome back.</Text>
          <Text className="text-muted font-poppins text-[13px] text-center mt-[5px]">A little balance, every day.</Text>

          <View className="mt-[32px]">
            <Text className="text-text font-poppins-semibold text-[12px] mb-[8px]">Email address</Text>
            <View className="min-h-[56px] flex-row items-center gap-[11px] pl-[16px] pr-[8px] bg-surface border border-border rounded-[17px] mb-[19px]">
              <Ionicons name="mail-outline" size={20} color="#9A9E96" />
              <TextInput className="flex-1 min-w-0 min-h-[54px] text-text font-poppins text-[13px] py-[12px]" accessibilityLabel="Email address" placeholder="you@example.com" placeholderTextColor="#A7ABA3" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" underlineColorAndroid="transparent" returnKeyType="next" onSubmitEditing={() => passwordInput.current?.focus()} submitBehavior="submit" />
            </View>

            <Text className="text-text font-poppins-semibold text-[12px] mb-[8px]">Password</Text>
            <View className="min-h-[56px] flex-row items-center gap-[11px] pl-[16px] pr-[8px] bg-surface border border-border rounded-[17px] mb-[19px]">
              <Ionicons name="lock-closed-outline" size={20} color="#9A9E96" />
              <TextInput ref={passwordInput} className="flex-1 min-w-0 min-h-[54px] text-text font-poppins text-[13px] py-[12px]" accessibilityLabel="Password" placeholder="Enter your password" placeholderTextColor="#A7ABA3" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} autoComplete="current-password" textContentType="password" underlineColorAndroid="transparent" returnKeyType="done" onSubmitEditing={handleLogin} />
              <Pressable className="w-[44px] h-[44px] items-center justify-center active:opacity-70" onPress={() => setShowPassword(value => !value)} accessibilityRole="button" accessibilityLabel={showPassword ? "Hide password" : "Show password"}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={21} color="#8D938B" />
              </Pressable>
            </View>

            {error ? <Text className="text-[#CC3C38] font-poppins text-[12px] mb-[12px]" accessibilityLiveRegion="polite">{error}</Text> : null}

            <Pressable className="min-h-[56px] rounded-[18px] bg-primary flex-row items-center justify-center gap-[12px] mt-[7px] active:opacity-85" accessibilityRole="button" onPress={handleLogin}>
              <Text className="text-white font-poppins-semibold text-[15px]">Log in</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </Pressable>
            <Link href="/" className="text-center py-[18px] text-[#687B71] font-poppins-semibold text-[12px]">Explore Meal Map</Link>
          </View>

          <View className="flex-1 justify-end items-center pt-[24px] gap-[8px]">
            <View className="w-[6px] h-[6px] rounded-full bg-[#B4D7C5]" />
            <Text className="text-[#9A9E95] font-poppins text-[10px]">Good food. Small steps. Your pace.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
