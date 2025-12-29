import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useOAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useWarmUpBrowser } from "../../lib/useWarmUpBrowser";
import { SafeAreaView } from "react-native-safe-area-context";

WebBrowser.maybeCompleteAuthSession();

export default function SignIn() {
  useWarmUpBrowser();
  const router = useRouter();

  const { startOAuthFlow: startGoogleFlow } = useOAuth({ strategy: "oauth_google" });
  const { startOAuthFlow: startAppleFlow } = useOAuth({ strategy: "oauth_apple" });

  const onSignInWithOAuth = React.useCallback(async (strategy: "oauth_google" | "oauth_apple") => {
    try {
      console.log(`Starting OAuth flow for ${strategy}...`);
      const startFlow = strategy === "oauth_google" ? startGoogleFlow : startAppleFlow;
      
      const { createdSessionId, setActive } = await startFlow({
        redirectUrl: Linking.createURL("/", { scheme: "llm-council" }),
      });

      console.log("OAuth response session ID:", createdSessionId);

      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
        router.replace("/(tabs)");
      } else {
        console.log("No session ID created yet, waiting for redirect...");
      }
    } catch (err: any) {
      console.error("OAuth error:", JSON.stringify(err, null, 2));
    }
  }, [startGoogleFlow, startAppleFlow, router]);

  return (
    <SafeAreaView className="flex-1 bg-white p-6">
      <View className="flex-1 justify-center items-center">
        <Text className="text-3xl font-bold mb-8 text-indigo-600">LLM Council</Text>
        <Text className="text-xl mb-8 text-gray-600">Sign in to sync your chats</Text>

        <TouchableOpacity
          className="w-full bg-black py-4 rounded-xl mb-4 flex-row justify-center items-center"
          onPress={() => onSignInWithOAuth("oauth_apple")}
        >
          <Text className="text-white font-semibold text-lg">Continue with Apple</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="w-full bg-white border border-gray-300 py-4 rounded-xl mb-4 flex-row justify-center items-center"
          onPress={() => onSignInWithOAuth("oauth_google")}
        >
          <Text className="text-gray-800 font-semibold text-lg">Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="mt-8"
          onPress={() => router.back()}
        >
          <Text className="text-indigo-600">Continue as Guest</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
