import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Plus, Search, Send } from "lucide-react-native";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";
import { useUIStore } from "../../lib/store";

/**
 * Home screen - Clean prompt entry point.
 * Centered branding with bottom-anchored input bar.
 */
export default function HomeScreen() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const createConversation = useMutation(api.conversations.create);
  const sendUserMessage = useMutation(api.messages.send);

  const { councilModels } = useUIStore();

  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim() || isSubmitting) return;

    if (!isSignedIn) {
      router.push("/(auth)");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create new conversation
      const conversationId = await createConversation({
        title: "New Chat",
      });

      // Navigate to chat immediately
      router.push(`/chat/${conversationId}`);

      // Clear input
      setMessage("");
    } catch (error) {
      console.error("Failed to create conversation:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1">
        {/* Centered Branding */}
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-2xl font-bold text-foreground text-center">
            LLM - COUNCIL
            <Text className="text-muted-foreground"> | </Text>
            <Text className="text-primary">FOR STUDENTS</Text>
          </Text>
          <Text className="text-muted-foreground text-center mt-3 text-base">
            Ask your council anything
          </Text>
        </View>

        {/* Bottom Input Bar */}
        <View className="px-4 pb-6 pt-3 bg-background border-t border-border">
          <View className="bg-card rounded-2xl border border-border overflow-hidden">
            {/* Text Input */}
            <TextInput
              className="text-base text-foreground px-4 pt-4 pb-2 min-h-[60px] max-h-32"
              placeholder="Ask anything..."
              placeholderTextColor="#6b7280"
              value={message}
              onChangeText={setMessage}
              multiline
              editable={!isSubmitting}
            />

            {/* Action Row */}
            <View className="flex-row items-center justify-between px-3 pb-3">
              {/* Left Icons */}
              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  className="w-10 h-10 items-center justify-center rounded-full bg-secondary"
                  disabled={isSubmitting}
                >
                  <Plus size={18} color="#9ca3af" />
                </TouchableOpacity>
                <TouchableOpacity
                  className="w-10 h-10 items-center justify-center rounded-full bg-secondary"
                  disabled={isSubmitting}
                >
                  <Search size={18} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              {/* Send Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!message.trim() || isSubmitting}
                className={`w-12 h-12 items-center justify-center rounded-full ${
                  message.trim() && !isSubmitting ? "bg-primary" : "bg-muted"
                }`}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#0f1419" />
                ) : (
                  <Send size={20} color="#0f1419" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Council Config Badge */}
          <View className="flex-row items-center justify-center mt-3 gap-2">
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/configure")}
              className="bg-primary/20 px-3 py-1.5 rounded-full"
            >
              <Text className="text-primary text-xs font-medium">
                Council Config
              </Text>
            </TouchableOpacity>
            <Text className="text-muted-foreground text-xs">
              {councilModels.length > 0
                ? `${councilModels.length} models selected`
                : "Default models"}
            </Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
