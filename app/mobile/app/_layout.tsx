import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useStore } from "../lib/store";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "../lib/tokenCache";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

// Initialize Convex client
const convex = new ConvexReactClient(
    process.env.EXPO_PUBLIC_CONVEX_URL as string
);

/**
 * Root layout for the app.
 * Sets up Clerk auth, Convex database, and navigation stack.
 */
export default function RootLayout() {
    const { loadSettings } = useStore();

    const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

    useEffect(() => {
        // Initialize app settings
        loadSettings();
    }, []);

    if (!publishableKey) {
        console.warn("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY");
    }

    return (
        <ClerkProvider
            publishableKey={publishableKey!}
            tokenCache={tokenCache}
        >
            <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
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
            </ConvexProviderWithClerk>
        </ClerkProvider>
    );
}

