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
  const { councilModels, activePresetId, chairmanModel, setPendingMessage } = useUIStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  const handleSubmit = async (message: string, attachments?: ExtractedFile[], images?: ExtractedImage[]) => {
    // Basic validation: must have text OR attachments OR images
    const hasContent = message.trim().length > 0 || (attachments && attachments.length > 0) || (images && images.length > 0);

    if (!hasContent || isSubmitting) return;

    if (!isSignedIn) {
      router.push("/(auth)");
      return;
    }

    setIsSubmitting(true);
    try {
      // Set the pending message in the global store
      setPendingMessage({
        content: message,
        attachments,
        images
      });

      const conversationId = await createConversation({
        title: "New Chat",
      });

      // Navigate to chat screen
      // Note: We don't pass initialMessage in query param anymore, ChatScreen will check the store
      router.push(`/chat/${conversationId}`);
    } catch (error) {
      console.error("Failed to create conversation:", error);
      // Clear pending message if failed
      setPendingMessage(null);
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

        <BottomInputBar
          onSend={handleSubmit}
          disabled={isSubmitting}
          councilModelsCount={councilModels.length}
          chairmanModel={chairmanModel}
          activePresetId={activePresetId}
          onSearchPress={() => setShowPresets(true)}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}
