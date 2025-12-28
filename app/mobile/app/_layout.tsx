import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useStore } from "../lib/store";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { ClerkProvider, ClerkLoaded } from "@clerk/clerk-expo";
import { tokenCache } from "../lib/tokenCache";
import Constants from "expo-constants";

/**
 * Root layout for the app.
 * Sets up the navigation stack and initializes app state.
 */
export default function RootLayout() {
    const { loadConversationsFromStorage, checkApiKeyExists } = useStore();

    // Fallback to env var or Constants.expoConfig if available.
    // In expo-router, process.env.EXPO_PUBLIC_... works.
    const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

    useEffect(() => {
        // Initialize app state
        loadConversationsFromStorage();
        checkApiKeyExists();
    }, []);

    if (!publishableKey) {
        // If no key is present, we render without Auth provider (Guest mode only or error?)
        // The user asked to SETUP ClerkProvider.
        // We will wrap it, but if key is missing, it might throw.
        // Let's assume the key is provided in .env.
        console.warn("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY");
    }

    return (
        <ClerkProvider
            publishableKey={publishableKey!}
            tokenCache={tokenCache}
        >
            <ClerkLoaded>
                <ErrorBoundary>
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
                        <Stack.Screen
                            name="(auth)/sign-in"
                            options={{
                                headerShown: false,
                                presentation: "modal"
                            }}
                        />
                        <Stack.Screen
                            name="chat/[id]"
                            options={{
                                title: "Chat",
                            }}
                        />
                    </Stack>
                </ErrorBoundary>
            </ClerkLoaded>
        </ClerkProvider>
    );
}
