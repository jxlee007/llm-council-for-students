import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useStore } from "../lib/store";

/**
 * Root layout for the app.
 * Sets up the navigation stack and initializes app state.
 * 
 * Note: Clerk authentication is not yet configured.
 * When you have a Clerk project, wrap this with ClerkProvider.
 */
export default function RootLayout() {
    const { loadConversationsFromStorage, checkApiKeyExists } = useStore();

    useEffect(() => {
        // Initialize app state
        loadConversationsFromStorage();
        checkApiKeyExists();
    }, []);

    return (
        <>
            <StatusBar style="auto" />
            <Stack
                screenOptions={{
                    headerStyle: {
                        backgroundColor: "#4f46e5",
                    },
                    headerTintColor: "#fff",
                    headerTitleStyle: {
                        fontWeight: "bold",
                    },
                }}
            >
                <Stack.Screen
                    name="(tabs)"
                    options={{
                        headerShown: false,
                    }}
                />
            </Stack>
        </>
    );
}
