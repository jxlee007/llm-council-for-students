import "../global.css";
import { Stack, useRouter, useSegments, Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useUIStore } from "../lib/store";
import { ErrorBoundary } from "../components/ErrorBoundary";
import OfflineBanner from "../components/OfflineBanner";
import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "../lib/tokenCache";
import { ConvexReactClient, useConvexAuth } from "convex/react";
import { useMutation } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { View, Text, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { api } from "../convex/_generated/api";

// Initialize Convex client
const convex = new ConvexReactClient(
    process.env.EXPO_PUBLIC_CONVEX_URL as string
);

function AppNavigation() {
    // CRITICAL: Use useConvexAuth instead of useAuth to prevent race condition
    // useAuth reports "signed in" before Convex receives the token, causing redirect loops
    const { isLoading, isAuthenticated } = useConvexAuth();
    const segments = useSegments();
    const router = useRouter();
    
    // Ensure user record exists in Convex on first login
    const getOrCreateUser = useMutation(api.users.getOrCreateUser);

    // Sync user data when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            getOrCreateUser()
                .then(() => console.log("[User Sync] User record ensured"))
                .catch((err) => console.error("[User Sync] Failed:", err));
        }
    }, [isAuthenticated]);

    useEffect(() => {
        // Wait until auth state is fully resolved
        if (isLoading) return;

        const inAuthGroup = segments[0] === "(auth)";

        if (!isAuthenticated && !inAuthGroup) {
            // Redirect to Login if not authenticated
            console.log("[Auth Guard] Redirecting to (auth)/login");
            router.replace("/(auth)/login");
        } else if (isAuthenticated && inAuthGroup) {
            // Redirect to Tabs if authenticated
            console.log("[Auth Guard] Redirecting to (tabs)");
            router.replace("/(tabs)");
        }
    }, [isAuthenticated, segments, isLoading]);

    // Show full-screen loading state while auth is being resolved
    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f1419' }}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={{ color: '#9ca3af', marginTop: 16, fontSize: 14 }}>Authenticating...</Text>
            </View>
        );
    }

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