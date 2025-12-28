import { Tabs } from "expo-router";
import { View, Text } from "react-native";

/**
 * Tab layout for the main app navigation.
 * Contains the chat list and settings tabs.
 */
export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: "#4f46e5",
                tabBarInactiveTintColor: "#9ca3af",
                tabBarStyle: {
                    backgroundColor: "#fff",
                    borderTopWidth: 1,
                    borderTopColor: "#e5e7eb",
                },
                headerStyle: {
                    backgroundColor: "#4f46e5",
                },
                headerTintColor: "#fff",
                headerTitleStyle: {
                    fontWeight: "bold",
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Chats",
                    headerTitle: "LLM Council",
                    tabBarIcon: ({ color }) => (
                        <View className="items-center justify-center">
                            <Text style={{ color, fontSize: 20 }}>💬</Text>
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="configure"
                options={{
                    title: "Council",
                    tabBarIcon: ({ color }) => (
                        <View className="items-center justify-center">
                            <Text style={{ color, fontSize: 20 }}>👥</Text>
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: "Settings",
                    tabBarIcon: ({ color }) => (
                        <View className="items-center justify-center">
                            <Text style={{ color, fontSize: 20 }}>⚙️</Text>
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="chat/[id]"
                options={{
                    href: null, // Hide from tab bar
                    title: "Chat",
                }}
            />
        </Tabs>
    );
}
