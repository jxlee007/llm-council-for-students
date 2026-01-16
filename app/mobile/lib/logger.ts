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
 * Sensitive data patterns to scrub from events.
 */
const SENSITIVE_HEADERS = [
  "authorization",
  "x-openrouter-key",
  "x-api-key",
  "cookie",
];

const SENSITIVE_PATTERNS = [
  /sk-[a-zA-Z0-9-_]+/g, // OpenRouter/OpenAI keys
  /pk_test_[a-zA-Z0-9]+/g, // Clerk test keys
  /pk_live_[a-zA-Z0-9]+/g, // Clerk live keys
];

/**
 * Scrub sensitive data from a string.
 */
function scrubString(str: string): string {
  let result = str;
  for (const pattern of SENSITIVE_PATTERNS) {
    result = result.replace(pattern, "[REDACTED]");
  }
  return result;
}

/**
 * Initialize the logger with Sentry integration.
 * Call this once at app startup.
 */
export function initLogger() {
  // Only enable Sentry in staging/production, never in local development
  const shouldEnable = !Config.isDevelopment && !!Config.sentryDsn;

  if (shouldEnable && !isSentryInitialized) {
    try {
      Sentry.init({
        dsn: Config.sentryDsn,

        // Explicitly enable only for non-development
        enabled: !Config.isDevelopment,

        // Tracing (Performance) - only in production
        tracesSampleRate: Config.isProduction ? 0.1 : 0,

        // Session Replay - only in production
        replaysSessionSampleRate: Config.isProduction ? 0.1 : 0,
        replaysOnErrorSampleRate: Config.isProduction ? 1.0 : 0,

        // Environment tag
        environment: Config.appVariant,

        // Restrict trace propagation to our backend only
        tracePropagationTargets: [Config.apiUrl],

        // Integrations
        integrations: [
          navigationIntegration,
          Sentry.mobileReplayIntegration({
            maskAllText: true,
            maskAllImages: true,
          }),
          Sentry.feedbackIntegration(),
        ],

        enableLogs: true,
        enableNativeFramesTracking: !isRunningInExpoGo(),

        // Data scrubbing - remove sensitive information before sending
        beforeSend(event: Sentry.Event) {
          // Scrub request headers
          if (event.request?.headers) {
            for (const header of SENSITIVE_HEADERS) {
              delete event.request.headers[header];
              delete event.request.headers[header.toLowerCase()];
            }
          }

          // Scrub breadcrumb messages
          if (event.breadcrumbs) {
            event.breadcrumbs = event.breadcrumbs.map((breadcrumb: Sentry.Breadcrumb) => {
              if (breadcrumb.message) {
                breadcrumb.message = scrubString(breadcrumb.message);
              }
              if (breadcrumb.data) {
                // Remove any data that might contain keys
                delete breadcrumb.data.apiKey;
                delete breadcrumb.data.key;
                delete breadcrumb.data.token;
              }
              return breadcrumb;
            });
          }

          // Scrub exception messages
          if (event.exception?.values) {
            for (const exception of event.exception.values) {
              if (exception.value) {
                exception.value = scrubString(exception.value);
              }
            }
          }

          return event;
        },

        // Don't send PII by default
        sendDefaultPii: false,
      });

      isSentryInitialized = true;
      console.log("[Logger] Sentry initialized for", Config.appVariant);
    } catch (error) {
      console.warn("[Logger] Failed to initialize Sentry:", error);
    }
  } else if (Config.isDevelopment) {
    console.log("[Logger] Sentry disabled in development");
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

  // Always log to console
  console.error("[LLM Council]", errorObj.message, context);

  if (isSentryInitialized) {
    // Scrub context before sending
    const safeContext = context ? { ...context } : {};
    delete safeContext.apiKey;
    delete safeContext.key;
    delete safeContext.token;

    Sentry.captureException(errorObj, {
      contexts: {
        additional: safeContext,
      },
    });
  }
}

/**
 * Log a warning message.
 */
export function logWarning(message: string, context?: Record<string, unknown>) {
  console.warn("[LLM Council]", message, context);

  if (isSentryInitialized) {
    Sentry.captureMessage(scrubString(message), {
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
  if (isSentryInitialized) {
    Sentry.setUser({
      id: userId,
      // Only include email in production if explicitly provided
      ...(Config.isProduction && email ? { email } : {}),
    });
  }
}

/**
 * Clear user context.
 * Call this when user logs out.
 */
export function clearUserContext() {
  if (isSentryInitialized) {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging.
 */
export function addBreadcrumb(
  category: string,
  message: string,
  level: "debug" | "info" | "warning" | "error" = "info"
) {
  if (isSentryInitialized) {
    Sentry.addBreadcrumb({
      category,
      message: scrubString(message),
      level,
    });
  }
}

/**
 * Set a tag for error categorization.
 */
export function setTag(key: string, value: string) {
  if (isSentryInitialized) {
    Sentry.setTag(key, scrubString(value));
  }
}

/**
 * Wrap the root component for Sentry instrumentation.
 */
export const sentryWrap = Sentry.wrap;
