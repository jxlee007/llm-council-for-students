export const Config = {
  clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "",
  convexUrl: process.env.EXPO_PUBLIC_CONVEX_URL || "",
  apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:8001",
  appVariant: process.env.EXPO_PUBLIC_APP_VARIANT || "development",
  validationError: null as string | null,
};

// Validate at module load time
const required = ["clerkPublishableKey", "convexUrl"];
const missing = required.filter(key => !Config[key as keyof typeof Config]);
if (missing.length > 0) {
  Config.validationError = `Missing required env vars: ${missing.join(", ")}`;
}

if (Config.appVariant === "production" && !Config.apiUrl.startsWith("https://")) {
  Config.validationError = "Production API URL must use HTTPS";
}

export default Config;
