import { useAuth } from "@/providers/auth-provider";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, Redirect, router } from "expo-router";
import { useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
const shortcuts = [
  {
    href: "/plan",
    title: "My meal plan",
    description: "A little planning, a better week.",
    icon: "calendar-outline",
    backgroundColor: "#E4F4EC",
    color: "#0C7762",
  },
  {
    href: "/meals",
    title: "Explore meals",
    description: "Find something good to cook.",
    icon: "restaurant-outline",
    backgroundColor: "#FFF4DC",
    color: "#967019",
  },
  {
    href: "/groceries",
    title: "My groceries",
    description: "Bring your next meal home.",
    icon: "basket-outline",
    backgroundColor: "#FCEBF0",
    color: "#B55472",
  },
] as const;

export default function ProfileScreen() {
  const { user, isLoading, signOut } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const logoutPending = useRef(false);
  const tabBarHeight = useBottomTabBarHeight();

  async function handleLogout() {
    if (logoutPending.current) return;

    logoutPending.current = true;
    setLoggingOut(true);
    setErrorMessage("");

    try {
      // The tab guard returns to public Home when the session is cleared.
      await signOut();
      router.replace("/login");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not log out. Please try again.",
      );
    } finally {
      logoutPending.current = false;
      setLoggingOut(false);
    }
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#0C7762" accessibilityLabel="Loading your profile" />
      </View>
    );
  }

  if (!user) return <Redirect href="/login" />;

  const initials = (user.name?.trim() || user.email)
  .split(/\s+/)
  .slice(0, 2)
  .map(word => word[0])
  .join("")
  .toUpperCase();
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="grow w-full max-w-[480px] self-center px-[20px] pt-[20px] pb-[28px]"
        contentContainerStyle={{
          paddingBottom: tabBarHeight + 24,
        }}
      >
        <View className="mb-[24px] flex-row items-center justify-between gap-[16px]">
          <View className="flex-1">
            <Text className="font-poppins-bold text-[28px] tracking-[-0.8px] text-text" accessibilityRole="header">
              Your profile
            </Text>
            <Text className="mt-[4px] font-poppins text-[12px] text-muted">
              A little balance, your way.
            </Text>
          </View>
          <View className="h-[46px] w-[46px] items-center justify-center rounded-full border border-border bg-surface">
            <Ionicons name="leaf-outline" size={23} color="#0C7762" accessible={false} />
          </View>
        </View>

        <View className="relative overflow-hidden rounded-[28px] bg-primary p-[24px]">
          <View pointerEvents="none" className="absolute -right-[45px] -top-[60px] h-[180px] w-[180px] rounded-full bg-white/10" />
          <View pointerEvents="none" className="absolute -bottom-[60px] -left-[30px] h-[120px] w-[120px] rounded-full bg-white/5" />
          <View className="mb-[22px] flex-row items-center justify-between gap-[16px]">
            <View className="h-[68px] w-[68px] items-center justify-center rounded-[24px] border-[4px] border-white/20 bg-[#DDF3E8]" accessible={false}>
              <Text className="font-poppins-bold text-[24px] text-primary">{initials}</Text>
            </View>
            <View className="flex-row items-center gap-[6px] rounded-full bg-white/15 px-[11px] py-[7px]">
              <Ionicons name="checkmark-circle" size={14} color="#DDF3E8" accessible={false} />
              <Text className="font-poppins-semibold text-[10px] text-white">Signed in</Text>
            </View>
          </View>
          <Text className="font-poppins-bold text-[22px] text-white">{user.name}</Text>
          <Text className="mt-[5px] font-poppins text-[13px] leading-[20px] text-white/90" selectable>
            {user.email}
          </Text>
          <View className="mt-[20px] border-t border-white/20 pt-[16px]">
            <Text className="font-poppins text-[12px] leading-[19px] text-white/90">
              Good food. Small steps. A healthier you.
            </Text>
          </View>
        </View>

        <Text className="mb-[12px] mt-[28px] font-poppins-bold text-[16px] text-text" accessibilityRole="header">
          Your kitchen
        </Text>
        <View className="overflow-hidden rounded-[24px] border border-border bg-surface">
          {shortcuts.map((shortcut, index) => (
            <Link key={shortcut.href} href={shortcut.href} asChild>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={shortcut.title}
                disabled={loggingOut}
                accessibilityState={{ disabled: loggingOut }}
                className={`min-h-[86px] flex-row items-center gap-[13px] px-[16px] py-[16px] active:bg-background ${index < shortcuts.length - 1 ? "border-b border-border" : ""}`}
              >
                <View
                  className="h-[44px] w-[44px] items-center justify-center rounded-[15px]"
                  style={{ backgroundColor: shortcut.backgroundColor }}
                >
                  <Ionicons name={shortcut.icon} size={21} color={shortcut.color} accessible={false} />
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="font-poppins-semibold text-[13px] text-text">{shortcut.title}</Text>
                  <Text className="mt-[3px] font-poppins text-[11px] leading-[17px] text-muted">
                    {shortcut.description}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={17} color="#6D8580" accessible={false} />
              </Pressable>
            </Link>
          ))}
        </View>

        <View className="mt-[20px] flex-row items-start gap-[12px] rounded-[22px] bg-[#E4F1E9] p-[18px]">
          <Ionicons name="sunny-outline" size={24} color="#0C7762" accessible={false} />
          <View className="flex-1">
            <Text className="font-poppins-semibold text-[13px] text-text">Progress, one meal at a time.</Text>
            <Text className="mt-[5px] font-poppins text-[12px] leading-[19px] text-[#527568]">
              You don&apos;t need a perfect routine. Just a little room for good habits.
            </Text>
          </View>
        </View>

        {errorMessage ? (
          <Text className="mt-[20px] font-poppins text-[12px] leading-[19px] text-[#B93F3F]" accessibilityLiveRegion="polite" accessibilityRole="alert">
            {errorMessage}
          </Text>
        ) : null}

        <Pressable
          onPress={handleLogout}
          disabled={loggingOut}
          accessibilityRole="button"
          accessibilityLabel={loggingOut ? "Logging out" : "Log out"}
          accessibilityState={{ disabled: loggingOut, busy: loggingOut }}
          className={`mt-[24px] min-h-[54px] flex-row items-center justify-center gap-[10px] rounded-[18px] border border-[#F0DAD7] bg-[#FFF4F1] px-[20px] py-[14px] active:opacity-70 ${loggingOut ? "opacity-60" : ""}`}
        >
          {loggingOut ? (
            <ActivityIndicator color="#B14D43" />
          ) : (
            <Ionicons name="log-out-outline" size={20} color="#B14D43" accessible={false} />
          )}
          <Text className="font-poppins-semibold text-[14px] text-[#B14D43]">
            {loggingOut ? "Logging out..." : "Log out"}
          </Text>
        </Pressable>
        <Text className="mt-[20px] text-center font-poppins-semibold text-[11px] tracking-[1.5px] text-muted">
          MADE FOR YOUR EVERYDAY
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
