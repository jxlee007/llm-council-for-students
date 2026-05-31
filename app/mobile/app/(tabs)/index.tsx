import { useState, useMemo } from "react";
import { View, Text, TouchableWithoutFeedback, Keyboard, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useUIStore } from "../../lib/store";
import { useCouncilAuth } from "../../hooks/useCouncilAuth";
import { useChats } from "../../hooks/useChats";
import BottomInputBar from "../../components/BottomInputBar";
import PresetsModal from "../../components/PresetsModal";
import { ExtractedFile, ExtractedImage } from "../../lib/files";

/** Returns a time-aware greeting + emoji. */
function getGreeting(): { greeting: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { greeting: "Good morning", emoji: "☀️" };
  if (hour >= 12 && hour < 17) return { greeting: "Good afternoon", emoji: "👋" };
  if (hour >= 17 && hour < 21) return { greeting: "Good evening", emoji: "🌆" };
  return { greeting: "Hey there", emoji: "✨" };
}

/**
 * Home screen - Clean prompt entry point.
 * Uses BottomInputBar with animated keyboard handling.
 */
export default function HomeScreen() {
  const router = useRouter();
  const { isSignedIn } = useCouncilAuth();
  const { createChat } = useChats();
  const { councilModels, activePresetId, chairmanModel, setPendingMessage } = useUIStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const isWeb = Platform.OS === "web";

  // Compute greeting once on mount
  const { greeting, emoji } = useMemo(() => getGreeting(), []);

  const handleSubmit = async (message: string, attachments?: ExtractedFile[], images?: ExtractedImage[]) => {
    const hasContent = message.trim().length > 0 || (attachments && attachments.length > 0) || (images && images.length > 0);
    if (!hasContent || isSubmitting) return;

    if (!isSignedIn) {
      router.push("/(auth)");
      return;
    }

    setIsSubmitting(true);
    try {
      setPendingMessage({ content: message, attachments, images });
      const conversationId = await createChat("New Chat");
      router.push(`/chat/${conversationId}`);
    } catch (error) {
      console.error("Failed to create conversation:", error);
      setPendingMessage(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="flex-1 bg-background">

        {/* Centered content area */}
        <View className="flex-1 items-center justify-center px-8 pb-40">
          {isWeb ? (
            /* ── Web greeting ── */
            <>
              <Text
                style={{
                  fontSize: 36,
                  fontWeight: "700",
                  color: "#f1f5f9",
                  textAlign: "center",
                  letterSpacing: -0.5,
                  marginBottom: 8,
                }}
              >
                {emoji} {greeting}
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  color: "#64748b",
                  textAlign: "center",
                  marginBottom: 4,
                }}
              >
                What would you like the Council to explore today?
              </Text>
            </>
          ) : (
            /* ── Mobile branding ── */
            <>
              <Text className="text-2xl font-bold text-foreground text-center">
                LLM - COUNCIL
                <Text className="text-muted-foreground"> | </Text>
                <Text className="text-primary">FOR STUDENTS</Text>
              </Text>
              <Text className="text-muted-foreground text-center mt-3 text-base">
                Ask your council anything
              </Text>
            </>
          )}
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
