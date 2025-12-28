import { Tabs } from "expo-router";
import { MessageSquare, Users, Settings } from "lucide-react-native";

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
                    tabBarIcon: ({ color, size }) => (
                        <MessageSquare color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="configure"
                options={{
                    title: "Council",
                    tabBarIcon: ({ color, size }) => (
                        <Users color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: "Settings",
                    tabBarIcon: ({ color, size }) => (
                        <Settings color={color} size={size} />
                    ),
                }}
            />
        </Tabs>
    );
}
