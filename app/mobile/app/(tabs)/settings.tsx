import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Lightbulb, Info, LogOut, User } from "lucide-react-native";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";

/**
 * Settings screen for app configuration.
 * Includes Authentication, BYOK API key management and other preferences.
 */
export default function SettingsScreen() {
  const { signOut, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();

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
    <View className="flex-1 bg-background">
      {/* Account Section */}
      <View className="mt-6 mx-4">
        <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Account
        </Text>
        <View className="bg-card rounded-xl border border-border overflow-hidden">
          {isSignedIn ? (
            <View className="p-4">
              <View className="flex-row items-center mb-4">
                <View className="h-10 w-10 bg-primary/20 rounded-full items-center justify-center mr-3">
                  <Text className="text-primary font-bold text-lg">
                    {user?.firstName?.charAt(0) ||
                      user?.emailAddresses[0]?.emailAddress?.charAt(0) ||
                      "U"}
                  </Text>
                </View>
                <View>
                  <Text className="text-base font-semibold text-foreground">
                    {user?.fullName || "User"}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    {user?.primaryEmailAddress?.emailAddress}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleSignOut}
                className="p-3 bg-red-500/10 rounded-lg flex-row items-center justify-center"
              >
                <LogOut size={18} color="#ef4444" className="mr-2" />
                <Text className="text-red-500 font-medium">Sign Out</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="p-4">
              <Text className="text-sm text-muted-foreground mb-4">
                Sign in to sync your conversation history across devices.
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(auth)/login")}
                className="bg-primary py-3 rounded-lg flex-row items-center justify-center"
              >
                <User size={18} color="#0f1419" className="mr-2" />
                <Text className="text-background font-semibold">
                  Sign In / Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* About Section */}
      <View className="mt-6 mx-4">
        <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          About
        </Text>
        <View className="bg-card rounded-xl border border-border p-4">
          <View className="flex-row items-center mb-1">
            <Info size={18} color="#6366f1" className="mr-2" />
            <Text className="text-base font-semibold text-foreground">
              LLM Council
            </Text>
          </View>
          <Text className="text-sm text-muted-foreground">
            Get answers from a council of AI models that work together to
            provide the best response to your questions.
          </Text>
          <View className="mt-4 pt-4 border-t border-border">
            <Text className="text-xs text-muted-foreground">Version 1.0.0</Text>
          </View>
        </View>
      </View>

      {/* Info Banner */}
      <View className="mx-4 mt-6 bg-primary/10 rounded-xl p-4 border border-primary/30 flex-row">
        <Lightbulb size={20} color="#6366f1" className="mr-3 mt-0.5" />
        <Text className="text-sm text-foreground flex-1">
          <Text className="font-semibold">Tip:</Text> Add your OpenRouter API
          key to use premium models and get unlimited queries!
        </Text>
      </View>
    </View>
  );
}
