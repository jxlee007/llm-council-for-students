import "../global.css";
import { useEffect } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import {
  Stack,
  useRouter,
  useSegments,
  useNavigationContainerRef,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/clerk-expo";
import { ConvexReactClient, useConvexAuth, useMutation } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { AlertTriangle } from "lucide-react-native";

import { ErrorBoundary } from "../components/ErrorBoundary";
import OfflineBanner from "../components/OfflineBanner";
import { tokenCache } from "../lib/tokenCache";
import { useUIStore } from "../lib/store";
import { api } from "../convex/_generated/api";
import Config, { getConfigErrorMessage } from "../lib/config";
import { initLogger, sentryWrap, navigationIntegration } from "../lib/logger";

// Initialize Convex client (only if URL is valid)
const convex = Config.convexUrl
  ? new ConvexReactClient(Config.convexUrl)
  : null;

// Initialize Sentry immediately at module load
// This must run before Sentry.wrap() which is called on default export
initLogger();

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
  const router = useRouter();

  const getOrCreateUser = useMutation(api.users.getOrCreateUser);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, segments, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      getOrCreateUser()
        .then(() => console.log("[User Sync] User record ensured"))
        .catch((err) => console.error("[User Sync] Failed:", err));
    }
  }, [isAuthenticated, getOrCreateUser]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0f1419",
        }}
      >
        <ActivityIndicator size="large" color="#20c997" />
        <Text style={{ color: "#9ca3af", marginTop: 16 }}>
          Connecting to Council...
        </Text>
      </View>
    );
  }

  return (
    <>
      {/* OfflineBanner moved here to ensure navigation context is available */}
      <OfflineBanner />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0f1419" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="(auth)/login"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen name="chat/[id]" options={{ title: "Chat" }} />
      </Stack>
    </>
  );
}

/**
 * Configuration Error Screen
 * Shown when critical environment variables are missing or invalid.
 */
function ConfigErrorScreen() {
  const errorMessage = getConfigErrorMessage();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fef2f2",
        padding: 32,
      }}
    >
      <AlertTriangle size={64} color="#dc2626" />
      <Text
        style={{
          fontSize: 20,
          fontWeight: "bold",
          color: "#991b1b",
          marginTop: 24,
          textAlign: "center",
        }}
      >
        Configuration Error
      </Text>
      <Text
        style={{
          color: "#b91c1c",
          marginTop: 16,
          textAlign: "center",
          lineHeight: 22,
        }}
      >
        {errorMessage}
      </Text>
      {!Config.isProduction && Config.validationWarnings.length > 0 && (
        <View style={{ marginTop: 24 }}>
          <Text style={{ color: "#92400e", fontWeight: "600" }}>Warnings:</Text>
          {Config.validationWarnings.map((warning, i) => (
            <Text
              key={i}
              style={{ color: "#92400e", fontSize: 12, marginTop: 4 }}
            >
              • {warning}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

function RootLayout() {
  const loadSettings = useUIStore((state) => state.loadSettings);
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Register navigation container with Sentry for route tracking
  useEffect(() => {
    if (navigationRef) {
      navigationIntegration.registerNavigationContainer(navigationRef);
    }
  }, [navigationRef]);

  // Fail fast on configuration errors
  if (Config.validationError) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <ConfigErrorScreen />
      </SafeAreaProvider>
    );
  }

  // Safety check for Convex client
  if (!convex) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <ConfigErrorScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ClerkProvider
        publishableKey={Config.clerkPublishableKey}
        tokenCache={tokenCache}
      >
        <ClerkLoaded>
          <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
            <ErrorBoundary>
              <StatusBar style="light" />
              <AppNavigation />
            </ErrorBoundary>
          </ConvexProviderWithClerk>
        </ClerkLoaded>
      </ClerkProvider>
    </SafeAreaProvider>
  );
}

export default sentryWrap(RootLayout);
