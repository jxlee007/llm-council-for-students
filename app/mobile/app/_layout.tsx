import "../global.css";
import { Stack, useRouter, useSegments, Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useUIStore } from "../lib/store";
import { ErrorBoundary } from "../components/ErrorBoundary";
import OfflineBanner from "../components/OfflineBanner";
import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "../lib/tokenCache";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { View, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Initialize Convex client
const convex = new ConvexReactClient(
    process.env.EXPO_PUBLIC_CONVEX_URL as string
);

function AppNavigation() {
    const { isLoaded, isSignedIn } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (!isLoaded) return;

        const inAuthGroup = segments[0] === "(auth)";

        if (!isSignedIn && !inAuthGroup) {
            // Redirect to Login if not signed in
            console.log("[Auth Guard] Redirecting to (auth)/login");
            router.replace("/(auth)/login");
        } else if (isSignedIn && inAuthGroup) {
            // Redirect to Tabs if signed in
            console.log("[Auth Guard] Redirecting to (tabs)");
            router.replace("/(tabs)");
        }
    }, [isSignedIn, segments, isLoaded]);

    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: "#0f1419" }, // Dark Mode Header
                headerTintColor: "#fff",
                headerTitleStyle: { fontWeight: "bold" },
            }}
        >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/login" options={{ headerShown: false, presentation: "modal" }} />
            <Stack.Screen name="chat/[id]" options={{ title: "Chat" }} />
        </Stack>
    );
}

export default function RootLayout() {
    const { loadSettings } = useUIStore();
    const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

    useEffect(() => {
        loadSettings();
    }, []);

    if (!publishableKey) {
        throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in .env");
    }

    return (
        // ✅ 1. Single Root Provider
        <SafeAreaProvider>
            <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
                <ClerkLoaded>
                    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                        <ErrorBoundary>
                            <StatusBar style="light" />
                            <OfflineBanner />
                            {/* ✅ 2. Navigation Logic */}
                            <AppNavigation />
                        </ErrorBoundary>
                    </ConvexProviderWithClerk>
                </ClerkLoaded>
            </ClerkProvider>
        </SafeAreaProvider>
    );
}