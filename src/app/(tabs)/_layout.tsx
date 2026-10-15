import { useAuth } from "@/providers/auth-provider";
import Ionicons from "@expo/vector-icons/Ionicons";
import { PlatformPressable } from "@react-navigation/elements";
import { Tabs } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
export default function TabsLayout() {
const { user, isLoading } = useAuth();
const insets = useSafeAreaInsets();

if (isLoading) return null;
const bottomPadding = Math.max(insets.bottom, 12);
  return (
    <Tabs 
        initialRouteName="index"
        screenOptions={{
            headerShown: false,
            tabBarHideOnKeyboard: true,
            tabBarActiveTintColor: "#0C7762",
            tabBarInactiveTintColor: "#6D8580",
            tabBarStyle: {
                position: "absolute",
                backgroundColor: "transparent",
                borderTopWidth: 0,
                elevation: 0,
                shadowOpacity: 0,
                height: 96,
                paddingTop: 5,
                paddingBottom: bottomPadding,
                display: user ? "flex" : "none",
            },
            tabBarBackground: () => (
            <View
                pointerEvents="none"
                className="absolute top-[32px] bottom-0 left-0 right-0 bg-background border-t-[1px] border-[#c6cadf]"
            />
            ),
            tabBarLabelPosition: "below-icon",
            tabBarItemStyle: {
                paddingTop: 32,
            },
            tabBarIconStyle: {
                width: 24,
                height: 24,
            },
            tabBarLabelStyle: {
                fontFamily: "Poppins_600SemiBold",
                fontSize: 11,
            },
            sceneStyle: {
                backgroundColor: "#F3F8F5",
            },
        }}
    >
        <Tabs.Protected guard={!!user}>
            <Tabs.Screen
                name="meals"
                options={{
                    title: "Meals",
                    tabBarIcon: ({ color, size, focused }) => (
                    <Ionicons
                        name={focused ? "restaurant" : "restaurant-outline"}
                        size={size}
                        color={color}
                    />
                    ),
                }}
            />
            <Tabs.Screen
                name="plan"
                options={{
                    title: "Plan",
                    tabBarIcon: ({ color, size, focused }) => (
                    <Ionicons
                        name={focused ? "calendar" : "calendar-outline"}
                        size={size}
                        color={color}
                    />
                    ),
                }}
            />
        </Tabs.Protected>
        <Tabs.Screen
            name="index"
            options={{
            title: "Home",
            tabBarAccessibilityLabel: "Home",
            tabBarItemStyle: { paddingTop: 0 },
            tabBarButton: (props) => (
                <PlatformPressable
                {...props}
                style={[
                    props.style,
                    {
                    padding: 0,
                    alignItems: "center",
                    justifyContent: "flex-start",
                    },
                ]}
                >
                <View className="w-[64px] h-[64px] rounded-full bg-primary border-[6px] border-secondary items-center justify-center">
                    <Ionicons name="home" color="#FFFFFF" size={26} />
                </View>
                </PlatformPressable>
            ),
            }}
        />
        <Tabs.Protected guard={!!user}>
            <Tabs.Screen
                    name="groceries"
                    options={{
                        title: "Groceries",
                        tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons
                            name={focused ? "cart" : "cart-outline"}
                            size={size}
                            color={color}
                        />
                        ),
                    }}
                />
            <Tabs.Screen
            name="profile"
            options={{
                title: "Profile",
                tabBarIcon: ({ color, size, focused }) => (
                <Ionicons
                    name={focused ? "person" : "person-outline"}
                    size={size}
                    color={color}
                />
                ),
            }}
        />
        </Tabs.Protected>
    </Tabs>
  );
}
