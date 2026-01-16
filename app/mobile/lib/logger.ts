/**
 * Centralized logging and crash reporting.
 * Integrates with Sentry for production error tracking.
 */

import * as Sentry from "@sentry/react-native";
import { Config } from "./config";
import { isRunningInExpoGo } from "expo";

let isSentryInitialized = false;

// Create navigation integration that can be registered later
export const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: !isRunningInExpoGo(), // Only in native builds
  routeChangeTimeoutMs: 1000,
  ignoreEmptyBackNavigationTransactions: true,
});

/**
 * Initialize the logger with Sentry integration.
 * Call this once at app startup.
 */
export function initLogger() {
  if (Config.sentryDsn && !isSentryInitialized) {
    try {
      Sentry.init({
        dsn: Config.sentryDsn,

        // Tracing (Performance)
        tracesSampleRate: Config.isDevelopment ? 0 : 0.2, // Disable in dev to reduce noise

        // Session Replay
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,

        // Environment
        environment: Config.appVariant,

        // Integrations
        integrations: [
          navigationIntegration, // Expo Router navigation tracking
          Sentry.mobileReplayIntegration({
            maskAllText: true,
            maskAllImages: true,
          }),
          Sentry.feedbackIntegration(),
        ],

        enableLogs: true,
        enableNativeFramesTracking: !isRunningInExpoGo(), // Only in native builds
      });

      isSentryInitialized = true;
      console.log("[Logger] Sentry initialized");
    } catch (error) {
      console.warn("[Logger] Failed to initialize Sentry:", error);
    }
  }
}

/**
 * Log an error with optional context.
 * In production, this sends to Sentry. In development, logs to console.
 */
export function logError(
  error: unknown,
  context?: Record<string, unknown>
) {
  const errorObj = error instanceof Error ? error : new Error(String(error));

  // Always log to console in development
  console.error("[LLM Council]", errorObj.message, context);

  if (isSentryInitialized) {
    Sentry.captureException(errorObj, {
      contexts: {
        additional: context || {},
      },
      extra: context,
    });
  }
}

/**
 * Log a warning message.
 */
export function logWarning(message: string, context?: Record<string, unknown>) {
  console.warn("[LLM Council]", message, context);

  if (isSentryInitialized) {
    Sentry.captureMessage(message, {
      level: "warning",
      contexts: {
        additional: context || {},
      },
    });
  }
}

/**
 * Set user context for error tracking.
 * Call this when user logs in.
 */
export function setUserContext(userId: string, email?: string) {
  console.log("[Logger] Setting user context:", userId);

  if (isSentryInitialized) {
    Sentry.setUser({
      id: userId,
      email,
    });
  }
}

/**
 * Clear user context.
 * Call this when user logs out.
 */
export function clearUserContext() {
  console.log("[Logger] Clearing user context");

  if (isSentryInitialized) {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging.
 * Breadcrumbs are events leading up to an error.
 */
export function addBreadcrumb(
  category: string,
  message: string,
  level: "debug" | "info" | "warning" | "error" = "info"
) {
  if (isSentryInitialized) {
    Sentry.addBreadcrumb({
      category,
      message,
      level,
    });
  }
}

/**
 * Set a tag for error categorization.
 */
export function setTag(key: string, value: string) {
  if (isSentryInitialized) {
    Sentry.setTag(key, value);
  }
}

/**
 * Wrap the root component for Sentry instrumentation.
 */
export const sentryWrap = Sentry.wrap;
