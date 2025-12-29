import React, { useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView 
} from "react-native";
import { useSignIn, useOAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useWarmUpBrowser } from "../../lib/useWarmUpBrowser";
import { SafeAreaView } from "react-native-safe-area-context";
import { Mail, Lock, ChevronRight, Chrome } from "lucide-react-native";
import { Apple } from "lucide-react-native"; // Lucide doesn't have a great Apple icon in all versions, but let's assume it works or fallback

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  useWarmUpBrowser();
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();
  
  const { startOAuthFlow: startGoogleFlow } = useOAuth({ strategy: "oauth_google" });
  const { startOAuthFlow: startAppleFlow } = useOAuth({ strategy: "oauth_apple" });

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSignInWithOAuth = async (strategy: "oauth_google" | "oauth_apple") => {
    try {
      const startFlow = strategy === "oauth_google" ? startGoogleFlow : startAppleFlow;
      
      const { createdSessionId, setActive: setOAuthActive } = await startFlow({
        redirectUrl: Linking.createURL("/(tabs)", { scheme: "llm-council" }),
      });

      if (createdSessionId) {
        setOAuthActive!({ session: createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (err) {
      console.error("OAuth error", err);
    }
  };

  const onSignInPress = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError(null);

    try {
      const completeSignIn = await signIn.create({
        identifier: emailAddress,
        password,
      });

      await setActive({ session: completeSignIn.createdSessionId });
      router.replace("/(tabs)");
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setError(err.errors?.[0]?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6">
          <View className="flex-1 justify-center py-10">
            {/* Header */}
            <View className="mb-10">
              <Text className="text-4xl font-extrabold text-indigo-600 mb-2">LLM Council</Text>
              <Text className="text-lg text-gray-500">Your AI advisors, anywhere.</Text>
            </View>

            {/* Error Message */}
            {error && (
              <View className="bg-red-50 p-4 rounded-xl mb-6">
                <Text className="text-red-600 text-sm font-medium">{error}</Text>
              </View>
            )}

            {/* Form */}
            <View className="space-y-4 mb-8">
              <View className="bg-gray-50 rounded-2xl flex-row items-center px-4 py-3 border border-gray-100">
                <Mail size={20} color="#9ca3af" className="mr-3" />
                <TextInput
                  autoCapitalize="none"
                  placeholder="Email address"
                  placeholderTextColor="#9ca3af"
                  value={emailAddress}
                  onChangeText={setEmailAddress}
                  className="flex-1 text-gray-900 text-base py-1"
                />
              </View>

              <View className="bg-gray-50 rounded-2xl flex-row items-center px-4 py-3 border border-gray-100 mt-4">
                <Lock size={20} color="#9ca3af" className="mr-3" />
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  className="flex-1 text-gray-900 text-base py-1"
                />
              </View>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity 
              onPress={onSignInPress}
              disabled={loading}
              activeOpacity={0.8}
              className={`h-14 rounded-2xl flex-row items-center justify-center ${loading ? 'bg-indigo-400' : 'bg-indigo-600'}`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text className="text-white font-bold text-lg mr-2">Sign In</Text>
                  <ChevronRight size={20} color="white" />
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center my-8">
              <View className="flex-1 h-[1px] bg-gray-200" />
              <Text className="mx-4 text-gray-400 text-sm font-medium">OR</Text>
              <View className="flex-1 h-[1px] bg-gray-200" />
            </View>

            {/* Social Authentication */}
            <View className="flex-row space-x-4">
              <TouchableOpacity 
                onPress={() => onSignInWithOAuth("oauth_google")}
                className="flex-1 h-14 bg-white border border-gray-200 rounded-2xl flex-row items-center justify-center mr-2 shadow-sm"
              >
                <Chrome size={20} color="#4285F4" className="mr-3" />
                <Text className="text-gray-900 font-semibold">Google</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => onSignInWithOAuth("oauth_apple")}
                className="flex-1 h-14 bg-black rounded-2xl flex-row items-center justify-center ml-2 shadow-sm"
              >
                <Apple size={20} color="white" className="mr-3" />
                <Text className="text-white font-semibold">Apple</Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View className="mt-10 items-center">
              <Text className="text-gray-500">
                Don't have an account?{" "}
                <Text 
                  onPress={() => router.push("/(auth)/sign-up")} 
                  className="text-indigo-600 font-bold"
                >
                  Sign Up
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
