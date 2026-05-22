import "../global.css";
import { useEffect, useState, useRef } from "react";
import {
  View,
  ActivityIndicator,
  Text,
  AppState,
  AppStateStatus,
} from "react-native";
import {
  Stack,
  useRouter,
  useSegments,
  useNavigationContainerRef,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/clerk-expo";
import { ConvexReactClient, useConvexAuth, useMutation, useQuery } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { AlertTriangle } from "lucide-react-native";
import { ErrorBoundary as AppErrorBoundary } from "../components/ErrorBoundary";
import OfflineBanner from "../components/OfflineBanner";
import { tokenCache } from "../lib/tokenCache";
import { useUIStore } from "../lib/store";
import { api } from "../convex/_generated/api";
import Config, { getConfigErrorMessage } from "../lib/config";
import { initLogger, sentryWrap, navigationIntegration, logError, logWarning } from "../lib/logger";
import * as Sentry from '@sentry/react-native';

// Sentry is initialized via initLogger() in AppNavigation/RootLayout below.

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
 * 4. Handles app resume to prevent auth flicker.
 */
function AppNavigation() {
  const { isLoaded: isClerkLoaded, isSignedIn } = useAuth();
  const { isLoading: isConvexAuthLoading, isAuthenticated } = useConvexAuth();
  const segments = useSegments();
  const router = useRouter();

  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const settingsLoaded = useUIStore((state) => state.settingsLoaded);
  const hasApiKey = useUIStore((state) => state.hasApiKey);

  // Check Convex DB for existing API key
  const dbHasApiKey = useQuery(api.users.hasApiKey);

  // Track app state for resume handling
  const [isResuming, setIsResuming] = useState(false);
  const appStateRef = useRef(AppState.currentState);
  const navigationTimeoutRef = useRef<any | null>(null);

  // Handle app state changes to prevent auth flicker on resume
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (
          appStateRef.current.match(/inactive|background/) &&
          nextState === "active"
        ) {
          // App has come to foreground - give Clerk time to rehydrate
          setIsResuming(true);
          setTimeout(() => setIsResuming(false), 500);
        }
        appStateRef.current = nextState;
      },
    );

    return () => subscription.remove();
  }, []);

  // Sync API key status from Convex database when authenticated
  useEffect(() => {
    if (isAuthenticated && dbHasApiKey) {
      if (!hasApiKey) {
        logWarning("[API Key Sync] Stored API key found on Convex DB, syncing locally...");
        useUIStore.getState().saveApiKey("CONVEX_STORED");
      }
    }
  }, [isAuthenticated, dbHasApiKey, hasApiKey]);

  // Navigation guard with debounce to prevent rapid redirects
  useEffect(() => {
    if (!isClerkLoaded || !settingsLoaded || isResuming) return;

    // Clear any pending navigation
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    // Debounce navigation decisions
    navigationTimeoutRef.current = setTimeout(() => {
      const pathSegments = segments as string[];
      const inAuthGroup = pathSegments[0] === "(auth)";
      const isSetupApiKeyScreen = pathSegments[0] === "(auth)" && pathSegments[1] === "setup-api-key";

      if (!isSignedIn) {
        if (!inAuthGroup) {
          router.replace("/(auth)/login");
        }
      } else {
        // User is signed in.
        // Wait for Convex auth to load and dbHasApiKey query to resolve before checking if they need to setup key.
        const isResolvingAuth = isConvexAuthLoading || (isAuthenticated && dbHasApiKey === undefined);
        if (isResolvingAuth) {
          return;
        }

        if (!hasApiKey) {
          // If no API key, they must be redirected to setup-api-key
          if (!isSetupApiKeyScreen) {
            router.replace("/(auth)/setup-api-key");
          }
        } else {
          // User is signed in and has API key
          if (inAuthGroup) {
            router.replace("/(tabs)");
          }
        }
      }
    }, 100);

    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, [
    isSignedIn,
    segments,
    isClerkLoaded,
    settingsLoaded,
    hasApiKey,
    isResuming,
    router,
    isConvexAuthLoading,
    isAuthenticated,
    dbHasApiKey,
  ]);

  // Sync user record when authenticated in Convex
  useEffect(() => {
    if (isAuthenticated) {
      getOrCreateUser()
        .then(() => logWarning("[User Sync] User record ensured"))
        .catch((err) => logError(err, { context: "User Sync" }));
    }
  }, [isAuthenticated, getOrCreateUser]);

  // Show loading during initial load
  if (!isClerkLoaded || !settingsLoaded) {
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
          contentStyle: { backgroundColor: "#0f1419" },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="(auth)/login"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="(auth)/setup-api-key"
          options={{ headerShown: false }}
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
    <SafeAreaProvider style={{ flex: 1, backgroundColor: "#0f1419" }}>
      <ClerkProvider
        publishableKey={Config.clerkPublishableKey}
        tokenCache={tokenCache}
      >
        <ClerkLoaded>
          <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
            <AppErrorBoundary>
              <StatusBar style="light" />
              <AppNavigation />
            </AppErrorBoundary>
          </ConvexProviderWithClerk>
        </ClerkLoaded>
      </ClerkProvider>
    </SafeAreaProvider>
  );
}

// Custom functional ErrorBoundary matching Expo Router specs
import { TouchableOpacity as RNTouchableOpacity } from "react-native";
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: "#0f1419", justifyContent: "center", alignItems: "center", padding: 24 }}>
      <View
        style={{
          backgroundColor: "#15202b",
          padding: 24,
          borderRadius: 24,
          alignItems: "center",
          borderWidth: 1,
          borderColor: "#38444d",
          width: "100%",
          maxWidth: 400,
        }}
      >
        <AlertTriangle size={64} color="#dc2626" />
        <Text style={{ fontSize: 24, fontWeight: "bold", color: "#fff", marginTop: 24, textAlign: "center" }}>
          UI Render Crash
        </Text>
        <Text style={{ color: "#8899a6", textAlign: "center", marginTop: 12, fontSize: 16 }}>
          The LLM Council encountered an unexpected interface error.
        </Text>

        <View style={{ marginTop: 24, backgroundColor: "#192734", padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "#38444d", width: "100%" }}>
          <Text style={{ color: "#f43f5e", fontSize: 12, fontFamily: "monospace" }} numberOfLines={6}>
            {error.toString()}
          </Text>
        </View>

        <RNTouchableOpacity
          style={{
            marginTop: 32,
            backgroundColor: "#20c997",
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 9999,
            width: "100%",
            alignItems: "center",
          }}
          onPress={retry}
          activeOpacity={0.8}
        >
          <Text style={{ color: "#0f1419", fontWeight: "bold", fontSize: 18 }}>
            Retry Rendering
          </Text>
        </RNTouchableOpacity>
      </View>
    </View>
  );
}

export default Sentry.wrap(sentryWrap(RootLayout));