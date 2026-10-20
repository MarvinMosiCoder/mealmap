import "@/styles/global.css";
import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold } from "@expo-google-fonts/poppins";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { 
  ActivityIndicator,
  Pressable,
  Text,
  View, } from "react-native";
import { AuthProvider, useAuth } from "@/providers/auth-provider";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({ Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold });

  useEffect(() => {
    if (loaded || error) void SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

function RootNavigator() {
  const {
    user,
    isLoading,
    error,
    refreshSession,
  } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-[24px]">
        <ActivityIndicator
          size="large"
          color="#0C7762"
          accessibilityLabel="Checking your session"
        />

        <Text className="mt-[16px] text-center font-poppins text-[13px] text-muted">
          Checking your session...
        </Text>
      </View>
    );
  }

  if (error && !user) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-[24px]">
        <Text className="text-center font-poppins-bold text-[22px] text-text">
          Could not check your session
        </Text>

        <Text
          className="mt-[12px] text-center font-poppins text-[13px] leading-[21px] text-muted"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>

        <Pressable
          onPress={() => void refreshSession()}
          accessibilityRole="button"
          className="mt-[24px] min-h-[48px] w-full items-center justify-center rounded-[16px] bg-primary px-[20px]"
        >
          <Text className="font-poppins-semibold text-[14px] text-white">
            Try again
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Stack
      initialRouteName="(tabs)"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="meal-category/[category]"
        options={{
          headerShown: true,
          title: "Explore meals",
        }}
      />
      <Stack.Protected guard={!!user}>
        <Stack.Screen
          name="add-meal"
          options={{
            headerShown: true,
            title: "Add meal",
          }}
        />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}
