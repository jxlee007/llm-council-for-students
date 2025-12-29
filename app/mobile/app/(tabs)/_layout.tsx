import { Tabs } from "expo-router";
import { MessageSquare, Users, Settings } from "lucide-react-native";

/**
 * Tab layout for the main app navigation.
 * Contains the chat list and settings tabs.
 * Styled for Dark Mode parity with Proto.
 */
export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: "#20c997",
                tabBarInactiveTintColor: "#6b7280",
                tabBarStyle: {
                    backgroundColor: "#1a1f26",
                    borderTopWidth: 1,
                    borderTopColor: "rgba(255, 255, 255, 0.1)",
                },
                headerStyle: {
                    backgroundColor: "#0f1419",
                    shadowColor: "transparent",
                    elevation: 0,
                    borderBottomWidth: 1,
                    borderBottomColor: "rgba(255, 255, 255, 0.1)",
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
