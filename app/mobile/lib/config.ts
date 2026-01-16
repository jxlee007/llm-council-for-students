/**
 * Application configuration with environment validation.
 * Fails fast on missing critical environment variables.
 */

export const Config = {
  // Core configuration
  clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "",
  convexUrl: process.env.EXPO_PUBLIC_CONVEX_URL || "",
  apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:8001",
  appVariant: (process.env.EXPO_PUBLIC_APP_VARIANT || "development") as "development" | "preview" | "production",

  // Optional configuration
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN || "",

  // Derived flags
  isProduction: process.env.EXPO_PUBLIC_APP_VARIANT === "production",
  isPreview: process.env.EXPO_PUBLIC_APP_VARIANT === "preview",
  isDevelopment: process.env.EXPO_PUBLIC_APP_VARIANT !== "production" && process.env.EXPO_PUBLIC_APP_VARIANT !== "preview",

  // Validation state
  validationError: null as string | null,
  validationWarnings: [] as string[],
};

// ============================================================================
// Environment Validation
// ============================================================================

const errors: string[] = [];
const warnings: string[] = [];

// Required environment variables
const requiredVars: (keyof typeof Config)[] = ["clerkPublishableKey", "convexUrl"];
const missingRequired = requiredVars.filter(key => !Config[key]);
if (missingRequired.length > 0) {
  errors.push(`Missing required env vars: ${missingRequired.join(", ")}`);
}

// Production-specific validation
if (Config.isProduction) {
  // API URL must use HTTPS in production
  if (!Config.apiUrl.startsWith("https://")) {
    errors.push("Production API URL must use HTTPS");
  }

  // Clerk key must not be a test key in production
  if (Config.clerkPublishableKey.includes("pk_test")) {
    errors.push("Production build must not use Clerk test keys (pk_test_...)");
  }

  // Sentry should be configured in production
  if (!Config.sentryDsn) {
    warnings.push("Sentry DSN not configured - crash reporting disabled");
  }
}

// Preview-specific validation
if (Config.isPreview) {
  // API URL should use HTTPS in preview
  if (!Config.apiUrl.startsWith("https://") && !Config.apiUrl.includes("localhost")) {
    warnings.push("Preview API URL should use HTTPS for security");
  }
}

// Set validation results
if (errors.length > 0) {
  Config.validationError = errors[0]; // Show first error
}
Config.validationWarnings = warnings;

// Log warnings in development
if (Config.isDevelopment && warnings.length > 0) {
  console.warn("[Config] Validation warnings:", warnings);
}

export default Config;

/**
 * Get a user-friendly error message for configuration issues.
 * In production, hide technical details.
 */
export function getConfigErrorMessage(): string {
  if (!Config.validationError) return "";

  if (Config.isProduction) {
    return "App configuration error. Please reinstall the app or contact support.";
  }

  return Config.validationError;
}
