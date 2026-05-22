import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useAuth, useClerk } from "@clerk/clerk-expo";
import { useAction } from "convex/react";
import * as WebBrowser from "expo-web-browser";
import { api } from "../../convex/_generated/api";
import { useUIStore } from "../../lib/store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Key, Eye, EyeOff, LogOut, Cpu } from "lucide-react-native";
import { useRouter } from "expo-router";

export default function SetupApiKeyScreen() {
  const { signOut } = useClerk();
  const insets = useSafeAreaInsets();
  const { saveApiKey } = useUIStore();
  const saveApiKeySecure = useAction(api.userActions.saveApiKeySecure);
  const router = useRouter();

  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      Alert.alert("Error", "Please enter a valid OpenRouter API key.");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Save in secure store locally & set hasApiKey state
      await saveApiKey(apiKey.trim());
      // 2. Save securely to Convex database
      await saveApiKeySecure({ apiKey: apiKey.trim() });
      
      Alert.alert("Success", "Your API key has been securely configured!");
    } catch (error) {
      console.error("[Setup API Key] Failed to save key:", error);
      Alert.alert("Error", "Failed to save API key. Please check your network and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          setIsSigningOut(true);
          try {
            await signOut();
            await useUIStore.getState().clearApiKey();
            router.replace("/(auth)/login");
          } catch (error) {
            console.error("[Setup API Key] Sign out failed:", error);
            Alert.alert("Error", "Failed to sign out. Please check your network and try again.");
          } finally {
            setIsSigningOut(false);
          }
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      className="flex-1 bg-background"
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 24,
          paddingTop: insets.top + 40,
          paddingBottom: insets.bottom + 40,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo and Header */}
        <View className="items-center mb-10">
          <View className="h-16 w-16 bg-primary/20 rounded-2xl items-center justify-center mb-4">
            <Cpu size={36} color="#20c997" />
          </View>
          <Text className="text-3xl font-extrabold text-foreground tracking-tight text-center">
            Council Configuration
          </Text>
          <Text className="text-sm text-muted-foreground text-center mt-3 px-4 leading-relaxed">
            LLM Council requires an OpenRouter API key to communicate with the model council and answer your queries.
          </Text>
        </View>

        {/* Form Container */}
        <View className="bg-card border border-border rounded-3xl p-6 shadow-sm mb-6">
          <Text className="text-sm font-semibold text-foreground mb-2">
            OpenRouter API Key
          </Text>
          
          <View className="flex-row items-center bg-background border border-border rounded-xl px-3 py-2.5 mb-4">
            <Key size={18} color="#8899a6" />
            <TextInput
              style={{ flex: 1, color: "#fff", fontSize: 16, paddingVertical: 4, marginLeft: 8 }}
              className="text-foreground text-base py-1 ml-2"
              placeholder="sk-or-v1-..."
              placeholderTextColor="#556677"
              value={apiKey}
              onChangeText={setApiKey}
              secureTextEntry={!showApiKey}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={handleSave}
            />
            <TouchableOpacity
              onPress={() => setShowApiKey(!showApiKey)}
              className="p-1"
            >
              {showApiKey ? (
                <EyeOff size={18} color="#8899a6" />
              ) : (
                <Eye size={18} color="#8899a6" />
              )}
            </TouchableOpacity>
          </View>

          <Text className="text-xs text-muted-foreground leading-relaxed mb-6">
            Get your key from{" "}
            <Text
              className="text-primary underline font-medium"
              onPress={() => WebBrowser.openBrowserAsync("https://openrouter.ai/workspaces/default/keys")}
            >
              openrouter.ai
            </Text>
            . Your key remains encrypted end-to-end and is never shared.
          </Text>

          {/* Action Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.8}
            className={`w-full py-4 rounded-xl items-center justify-center ${
              isSaving ? "bg-primary/50" : "bg-primary"
            }`}
          >
            {isSaving ? (
              <ActivityIndicator color="#0f1419" size="small" />
            ) : (
              <Text className="text-background font-bold text-base">
                Save & Continue
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Switch Account/Sign Out Option */}
        <TouchableOpacity
          onPress={handleSignOut}
          disabled={isSigningOut}
          activeOpacity={0.7}
          className="flex-row items-center justify-center py-3 bg-red-500/10 rounded-xl border border-red-500/20"
        >
          {isSigningOut ? (
            <ActivityIndicator size="small" color="#ef4444" />
          ) : (
            <>
              <LogOut size={16} color="#ef4444" />
              <Text className="text-red-500 font-semibold text-sm ml-2">
                Sign Out
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
