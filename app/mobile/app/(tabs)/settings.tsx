import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
} from "react-native";
import {
  CheckCircle,
  Trash2,
  Lightbulb,
  Info,
  LogOut,
  User,
  ShieldCheck,
} from "lucide-react-native";
import { useUIStore } from "../../lib/store";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

/**
 * Settings screen for app configuration.
 * Includes Authentication, BYOK API key management and other preferences.
 */
export default function SettingsScreen() {
  const { saveApiKey, clearApiKey } = useUIStore();
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { signOut, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  // Use Convex as source of truth for API key status
  const hasApiKeyInDB = useQuery(api.users.hasApiKey);
  const saveApiKeySecure = useAction(api.userActions.saveApiKeySecure);
  const clearApiKeyInDB = useMutation(api.users.clearApiKey);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert("Error", "Please enter a valid API key");
      return;
    }

    setIsSaving(true);
    try {
      // Save to Convex database with encryption (source of truth)
      await saveApiKeySecure({ apiKey: apiKey.trim() });
      // Also save to local storage as cache (for offline availability)
      await saveApiKey(apiKey.trim());
      setApiKey("");
      Alert.alert(
        "API Key Saved",
        "Your API key has been encrypted and stored securely."
      );
    } catch (error) {
      console.error("Failed to save API key:", error);
      Alert.alert("Error", "Failed to save API key. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearApiKey = () => {
    Alert.alert(
      "Remove API Key",
      "Are you sure you want to remove your API key?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              // Clear from Convex database (source of truth)
              await clearApiKeyInDB();
              // Also clear from local storage
              await clearApiKey();
              Alert.alert("Success", "API key removed");
            } catch (error) {
              console.error("Failed to clear API key:", error);
              Alert.alert(
                "Error",
                "Failed to remove API key. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Account Section */}
      <View className="mt-6 mx-4">
        <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Account
        </Text>
        <View className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {isSignedIn ? (
            <View className="p-4">
              <View className="flex-row items-center mb-4">
                <View className="h-10 w-10 bg-indigo-100 rounded-full items-center justify-center mr-3">
                  <Text className="text-indigo-600 font-bold text-lg">
                    {user?.firstName?.charAt(0) ||
                      user?.emailAddresses[0]?.emailAddress?.charAt(0) ||
                      "U"}
                  </Text>
                </View>
                <View>
                  <Text className="text-base font-semibold text-gray-900">
                    {user?.fullName || "User"}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    {user?.primaryEmailAddress?.emailAddress}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleSignOut}
                className="p-3 bg-red-50 rounded-lg flex-row items-center justify-center"
              >
                <LogOut size={18} color="#dc2626" className="mr-2" />
                <Text className="text-red-600 font-medium">Sign Out</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="p-4">
              <Text className="text-sm text-gray-600 mb-4">
                Sign in to sync your conversation history across devices.
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(auth)/login")}
                className="bg-black py-3 rounded-lg flex-row items-center justify-center"
              >
                <User size={18} color="#ffffff" className="mr-2" />
                <Text className="text-white font-semibold">
                  Sign In / Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* BYOK Section */}
      <View className="mt-6 mx-4">
        <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          API Configuration
        </Text>
        <View className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <View className="p-4 border-b border-gray-100">
            <Text className="text-base font-semibold text-gray-900">
              OpenRouter API Key
            </Text>
            <Text className="text-sm text-gray-500 mt-1">
              Bring your own key for unlimited free usage
            </Text>
          </View>

          {hasApiKeyInDB === undefined ? (
            <View className="p-4 items-center">
              <ActivityIndicator size="small" color="#4f46e5" />
            </View>
          ) : hasApiKeyInDB ? (
            <View className="p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <CheckCircle size={24} color="#16a34a" className="mr-2" />
                  <Text className="text-green-600 font-medium">
                    API Key configured
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleClearApiKey}
                  className="p-2 bg-red-100 rounded-lg flex-row items-center"
                >
                  <Trash2 size={16} color="#dc2626" />
                  <Text className="text-red-600 text-sm font-medium ml-1">
                    Remove
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="p-4">
              <View className="flex-row items-center mb-3">
                <TextInput
                  className="flex-1 bg-gray-100 rounded-lg px-4 py-3 text-base"
                  placeholder="sk-or-..."
                  value={apiKey}
                  onChangeText={setApiKey}
                  secureTextEntry={!showApiKey}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-sm text-gray-600">Show API key</Text>
                <Switch
                  value={showApiKey}
                  onValueChange={setShowApiKey}
                  trackColor={{ false: "#d1d5db", true: "#818cf8" }}
                  thumbColor={showApiKey ? "#4f46e5" : "#f9fafb"}
                />
              </View>
              <TouchableOpacity
                onPress={handleSaveApiKey}
                className="bg-primary-600 rounded-lg py-3 items-center"
              >
                <Text className="text-white font-semibold">Save API Key</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* About Section */}
      <View className="mt-6 mx-4">
        <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          About
        </Text>
        <View className="bg-white rounded-xl border border-gray-100 p-4">
          <View className="flex-row items-center mb-1">
            <Info size={18} color="#4f46e5" className="mr-2" />
            <Text className="text-base font-semibold text-gray-900">
              LLM Council
            </Text>
          </View>
          <Text className="text-sm text-gray-500">
            Get answers from a council of AI models that work together to
            provide the best response to your questions.
          </Text>
          <View className="mt-4 pt-4 border-t border-gray-100">
            <Text className="text-xs text-gray-400">Version 1.0.0</Text>
          </View>
        </View>
      </View>

      {/* Info Banner */}
      <View className="mx-4 mt-6 bg-blue-50 rounded-xl p-4 border border-blue-100 flex-row">
        <Lightbulb size={20} color="#1e40af" className="mr-3 mt-0.5" />
        <Text className="text-sm text-blue-800 flex-1">
          <Text className="font-semibold">Tip:</Text> Add your OpenRouter API
          key to use premium models and get unlimited queries!
        </Text>
      </View>
    </View>
  );
}
