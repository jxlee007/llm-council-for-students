import "../global.css";
import { useEffect } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/clerk-expo";
import { ConvexReactClient, useConvexAuth, useMutation } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

import { ErrorBoundary } from "../components/ErrorBoundary";
import OfflineBanner from "../components/OfflineBanner";
import { tokenCache } from "../lib/tokenCache";
import { useUIStore } from "../lib/store";
import { api } from "../convex/_generated/api";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

/**
 * AppNavigation handles authentication state and provides the navigation context.
 * 
 * DESIGN PATTERN:
 * 1. Strictly returns a Navigator (<Stack />) to provide NavigationContainer context.
 * 2. Uses useEffect for side-effect based redirects.
 * 3. Never renders screen components directly.
 */
function AppNavigation() {
    const { isLoading, isAuthenticated } = useConvexAuth();
    const segments = useSegments();

    // ✅ CRITICAL: Remove useRouter() - use direct navigation instead
    const getOrCreateUser = useMutation(api.users.getOrCreateUser);

    useEffect(() => {
        if (isAuthenticated) {
            getOrCreateUser()
                .then(() => console.log("[User Sync] User record ensured"))
                .catch((err) => console.error("[User Sync] Failed:", err));
        }
    }, [isAuthenticated, getOrCreateUser]);

    // ✅ SIMPLIFIED: No useRouter() - let Stack handle redirects naturally
    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0f1419" }}>
                <ActivityIndicator size="large" color="#20c997" />
                <Text style={{ color: "#9ca3af", marginTop: 16 }}>Connecting to Council...</Text>
            </View>
        );
    }

    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: "#0f1419" },
                headerTintColor: "#fff",
                headerTitleStyle: { fontWeight: "bold" },
            }}
        >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/login" options={{ headerShown: false, presentation: "modal" }} />
            <Stack.Screen name="chat/[id]" options={{ title: "Chat" }} />
        </Stack>
    );
}

export default function RootLayout() {
    const loadSettings = useUIStore((state) => state.loadSettings);
    const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

    useEffect(() => {
        loadSettings();
    }, []);

    if (!publishableKey) {
        throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in .env");
    }

    return (
        <SafeAreaProvider>
            <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
                <ClerkLoaded>
                    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                        <ErrorBoundary>
                            <StatusBar style="light" />
                            <OfflineBanner />
                            <AppNavigation />
                        </ErrorBoundary>
                    </ConvexProviderWithClerk>
                </ClerkLoaded>
            </ClerkProvider>
        </SafeAreaProvider>
    );
}