import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const isDev = process.env.EXPO_PUBLIC_APP_VARIANT === 'development';
  const isPreview = process.env.EXPO_PUBLIC_APP_VARIANT === 'preview';

  return {
    ...config,
    name: isDev ? "LLM Council (Dev)" : (isPreview ? "LLM Council (Prev)" : "LLM Council - For students"),
    slug: "llm-council-consensus",
    version: "1.0.0",
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
      bundleIdentifier: isDev ? "com.llmcouncil.app.dev" : (isPreview ? "com.llmcouncil.app.preview" : "com.llmcouncil.app")
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#4f46e5"
      },
      edgeToEdgeEnabled: true,
      package: isDev ? "com.llmcouncil.app.dev" : (isPreview ? "com.llmcouncil.app.preview" : "com.llmcouncil.app")
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    plugins: [
      "expo-router",
      "expo-secure-store",
      "expo-web-browser"
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      eas: {
        projectId: "your-project-id" // Placeholder, EAS CLI will update this if needed
      },
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      clerkKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
    }
  };
};
