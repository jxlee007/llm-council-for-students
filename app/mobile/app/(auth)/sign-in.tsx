import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useWarmUpBrowser } from "../../lib/useWarmUpBrowser";
import { SafeAreaView } from "react-native-safe-area-context";

WebBrowser.maybeCompleteAuthSession();

export default function SignIn() {
  useWarmUpBrowser();

  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const onSignInWithOAuth = React.useCallback(async (strategy: "oauth_google" | "oauth_apple") => {
    if (!isLoaded) return;

    try {
      const { createdSessionId, signIn: signInAttempt, setActive: setActiveAttempt } =
        await signIn.create({
          strategy,
        });

      if (createdSessionId) {
        setActiveAttempt!({ session: createdSessionId });
        router.replace("/(tabs)");
      } else {
        // Use signIn or signUp for next steps such as MFA
        console.error("Session not created", signInAttempt);
      }
    } catch (err) {
      console.error("OAuth error", err);
    }
  }, [isLoaded, signIn, setActive, router]);

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
