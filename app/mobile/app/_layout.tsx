import "../global.css";
import { Stack, useSegments, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useStore } from "../lib/store";
import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from "../lib/token-cache";
import { ErrorBoundary } from "../components/ErrorBoundary";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env',
  )
}

function RootLayoutNav() {
    const { loadConversationsFromStorage, checkApiKeyExists } = useStore();
    const { isLoaded, isSignedIn } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        // Initialize app state
        loadConversationsFromStorage();
        checkApiKeyExists();
    }, []);

    useEffect(() => {
        if (!isLoaded) return;

        const inTabsGroup = segments[0] === '(tabs)';
        const inAuthGroup = segments[0] === '(auth)';

        if (isSignedIn && inAuthGroup) {
            router.replace('/(tabs)/chat');
        } else if (!isSignedIn && !inAuthGroup) {
            router.replace('/(auth)/sign-in');
        }
    }, [isSignedIn, segments]);

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
                <Stack.Screen
                    name="(auth)/sign-in"
                    options={{
                        headerShown: false,
                    }}
                />
            </Stack>
        </>
    );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
        <ClerkLoaded>
          <RootLayoutNav />
        </ClerkLoaded>
      </ClerkProvider>
    </ErrorBoundary>
  );
}
