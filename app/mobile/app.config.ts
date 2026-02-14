import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const isDev = process.env.EXPO_PUBLIC_APP_VARIANT === 'development';
  const isPreview = process.env.EXPO_PUBLIC_APP_VARIANT === 'preview';
  const isProd = process.env.EXPO_PUBLIC_APP_VARIANT === 'production';

  const projectId = process.env.EAS_PROJECT_ID || '044eb304-db9b-49c9-9b3f-7d03bb4f0edd';

  // App naming based on environment
  const appName = isDev
    ? "LLM Council (Dev)"
    : (isPreview ? "LLM Council (Preview)" : "LLM Council");

  return {
    ...config,
    name: appName,
    slug: "llm-council-consensus",
    version: "1.0.0",
    runtimeVersion: {
      policy: "appVersion"
    },
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    scheme: "llm-council",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#4f46e5"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: isDev
        ? "com.llmcouncil.app.dev"
        : (isPreview ? "com.llmcouncil.app.preview" : "com.llmcouncil.app"),
      infoPlist: {
        NSCameraUsageDescription: "Used for attaching photos to messages",
        NSPhotoLibraryUsageDescription: "Used for attaching files to messages",
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#4f46e5"
      },
      edgeToEdgeEnabled: true,
      package: isDev
        ? "com.llmcouncil.app.dev"
        : (isPreview ? "com.llmcouncil.app.preview" : "com.llmcouncil.app"),
      permissions: [
        "android.permission.INTERNET",
        "android.permission.ACCESS_NETWORK_STATE"
      ]
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    plugins: [
      "expo-router",
      "expo-secure-store",
      "expo-web-browser",
      // Sentry Configuration - Disabled for builds until org is configured
      // [
      //   "@sentry/react-native/expo",
      //   {
      //     organization: process.env.SENTRY_ORG,
      //     project: process.env.SENTRY_PROJECT
      //   }
      // ]
    ],
    experiments: {
      typedRoutes: true
    },
    updates: {
      url: `https://u.expo.dev/${projectId}`,
      enabled: isProd || isPreview,
      fallbackToCacheTimeout: 0
    },
    extra: {
      eas: {
        projectId: projectId
      },
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      clerkKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
      sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    }
  };
};
