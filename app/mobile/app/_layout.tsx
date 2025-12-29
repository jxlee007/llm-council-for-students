import "../global.css";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useUIStore } from "../lib/store";
import { ErrorBoundary } from "../components/ErrorBoundary";
import OfflineBanner from "../components/OfflineBanner";
import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "../lib/tokenCache";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { View, Text, ActivityIndicator, Platform } from "react-native";
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
        console.log("[Auth Guard] isLoaded:", isLoaded, "isSignedIn:", isSignedIn, "segments:", segments);
        if (!isLoaded) return;

        const inAuthGroup = segments[0] === "(auth)";

        if (!isSignedIn && !inAuthGroup) {
            // Redirect to onboarding/login if not signed in and trying to access protected routes
            router.replace("/(auth)");
            console.log("[Auth Guard] Not signed in, redirecting to login");
            router.replace("/(auth)/login");
        } else if (isSignedIn && inAuthGroup) {
            console.log("[Auth Guard] Signed in and in auth group, redirecting to tabs");
            router.replace("/(tabs)");
        }
    }, [isSignedIn, segments, isLoaded]);

    return (
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
                name="(auth)/index"
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="(auth)/login"
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
    );
}

/**
 * Root layout for the app.
 * Sets up Clerk auth, Convex database, and navigation stack.
 */
export default function RootLayout() {
    const { loadSettings } = useUIStore();
    const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

    useEffect(() => {
        // Initialize app settings
        loadSettings();
    }, []);

    if (!publishableKey) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50">
                <Text className="text-red-500">Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY</Text>
            </View>
        );
    }

    return (
        <ClerkProvider
            publishableKey={publishableKey}
            tokenCache={tokenCache}
        >
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
        <SafeAreaProvider>
            <ClerkProvider
                publishableKey={publishableKey}
                tokenCache={tokenCache}
            >
                <ClerkLoaded>
                    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                        <ErrorBoundary>
                            <StatusBar style="auto" />
                            <AppNavigation />
                        </ErrorBoundary>
                    </ConvexProviderWithClerk>
                </ClerkLoaded>
            </ClerkProvider>
        </SafeAreaProvider>
    );
}
