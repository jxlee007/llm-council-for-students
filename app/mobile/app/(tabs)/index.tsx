import { useState } from "react";
import { View, Text, TouchableWithoutFeedback, Keyboard } from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";
import { useUIStore } from "../../lib/store";
import BottomInputBar from "../../components/BottomInputBar";
import PresetsModal from "../../components/PresetsModal";

/**
 * Home screen - Clean prompt entry point.
 * Uses BottomInputBar with animated keyboard handling.
 */
export default function HomeScreen() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const createConversation = useMutation(api.conversations.create);
  const { councilModels } = useUIStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  const handleSubmit = async (message: string) => {
    if (!message.trim() || isSubmitting) return;

    if (!isSignedIn) {
      router.push("/(auth)");
      return;
    }

    setIsSubmitting(true);
    try {
      const conversationId = await createConversation({
        title: "New Chat",
      });
      // Pass initial message to Chat screen via query params
      router.push(
        `/chat/${conversationId}?initialMessage=${encodeURIComponent(message)}`
      );
    } catch (error) {
      console.error("Failed to create conversation:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="flex-1 bg-background">
        {/* Centered Branding */}
        <View className="flex-1 items-center justify-center px-8 pb-40">
          <Text className="text-2xl font-bold text-foreground text-center">
            LLM - COUNCIL
            <Text className="text-muted-foreground"> | </Text>
            <Text className="text-primary">FOR STUDENTS</Text>
          </Text>
          <Text className="text-muted-foreground text-center mt-3 text-base">
            Ask your council anything
          </Text>
        </View>

        {/* Quick Presets Modal */}
        <PresetsModal
          visible={showPresets}
          onClose={() => setShowPresets(false)}
        />

        {/* Unified Input Bar with animated keyboard handling */}
        <BottomInputBar
          onSend={handleSubmit}
          disabled={isSubmitting}
          showCouncilBadge
          councilModelsCount={councilModels.length}
          onSearchPress={() => setShowPresets(true)}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}
