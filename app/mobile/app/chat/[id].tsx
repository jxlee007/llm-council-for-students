import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, FlatList, ActivityIndicator, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MessageSquare } from "lucide-react-native";
import { useUIStore } from "../../lib/store";
import { useChatMessages } from "../../hooks/useChatMessages";
import type { Message, AggregateRanking } from "../../lib/types";
import { ExtractedFile, ExtractedImage } from "../../lib/files";
import BottomInputBar from "../../components/BottomInputBar";
import MessageBubble from "../../components/MessageBubble";
import { Banner } from "../../components/Banner";
import { FadeInView } from "../../components/FadeInView";
import PresetsModal from "../../components/PresetsModal";
import { PRESETS } from "../../lib/presets";
import { FullscreenImageModal } from "../../components/FullscreenImageModal";
import { Id } from "../../convex/_generated/dataModel";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Chat screen using Convex runCouncil action for council processing.
 * Animations are driven by message.stage fields from backend data.
 */
function ChatScreen() {
  const { id, initialMessage } = useLocalSearchParams<{
    id: string;
    initialMessage?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const conversationId = id;
  const {
    conversation,
    messages,
    runCouncil,
    createAttachment,
    deleteMessage,
    isLoading,
  } = useChatMessages(id as string);

  const {
    councilModels,
    chairmanModel,
    activePresetId,
    customSystemPrompts,
    pendingMessage,
    setPendingMessage,
  } = useUIStore();

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canRetry, setCanRetry] = useState(false);
  const [lastMessage, setLastMessage] = useState<{
    content: string;
    attachment?: ExtractedFile;
    image?: ExtractedImage;
  } | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [messagesList, setMessagesList] = useState<any[]>([]);
  const [failedUserMessages, setFailedUserMessages] = useState<Record<string, {
    prompt: string;
    attachment?: ExtractedFile;
    image?: ExtractedImage;
  }>>({});
  const hasProcessedInitialMessage = useRef(false);

  // Sync messages from Convex to local messagesList state with status metadata
  useEffect(() => {
    if (messages !== undefined) {
      setMessagesList(
        messages
          .filter((m: any) => {
            // Filter out the assistant placeholder/error message if the preceding user message failed
            if (m.role === "assistant" && (m.error || m.processing)) {
              const idx = messages.findIndex((msg: any) => msg._id === m._id);
              if (idx > 0) {
                const prevMsg = messages[idx - 1];
                if (prevMsg && prevMsg.role === "user" && failedUserMessages[prevMsg._id]) {
                  return false;
                }
              }
            }
            return true;
          })
          .map((m: any) => {
            // Check if this user message is in our failed state record
            if (m.role === "user" && failedUserMessages[m._id]) {
              const failedInfo = failedUserMessages[m._id];
              return {
                ...m,
                status: "failed",
                errorDetails: failedInfo.prompt,
                failedAttachment: failedInfo.attachment,
                failedImage: failedInfo.image,
              };
            }
            // Normal sync
            return {
              ...m,
              status: m.error ? "failed" : m.processing ? "loading" : "success",
              errorDetails: m.error || undefined,
            };
          })
      );
    }
  }, [messages, failedUserMessages]);

  // Derive processing state from messagesList
  const processingMessage = messagesList?.find(
    (m: any) => m.role === "assistant" && m.status === "loading",
  );
  const isProcessing = !!processingMessage;

  // Derive current stage from the processing message
  const getCurrentStage = (): 0 | 1 | 2 | 3 | "vision" => {
    if (!processingMessage) return 0;
    const msg = processingMessage as any;
    // Check vision stage first (before council stages)
    if (msg.currentStage === "vision") return "vision";
    if (msg.stage3) return 3;
    if (msg.stage2?.length > 0) return 2;
    if (msg.stage1?.length > 0) return 1;
    return 1; // Default to stage 1 while processing
  };
  const currentStage = getCurrentStage();

  // Scroll to bottom when messages update
  useEffect(() => {
    if (flatListRef.current && messagesList?.length) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messagesList?.length, processingMessage?.stage1, processingMessage?.stage2]);

  // Process initial message from Home screen on mount
  useEffect(() => {
    // Check pendingMessage from store (new mechanism)
    if (
      pendingMessage &&
      conversation &&
      messages !== undefined &&
      messages.length === 0 &&
      !hasProcessedInitialMessage.current
    ) {
      hasProcessedInitialMessage.current = true;
      console.log("[ChatScreen] Processing pending message:", pendingMessage);

      handleSendMessage(
        pendingMessage.content,
        pendingMessage.attachments,
        pendingMessage.images,
      );

      // Clear the pending message
      setPendingMessage(null);
      return;
    }

    // Fallback: Check query param (legacy/deep link)
    if (
      initialMessage &&
      conversation &&
      messages !== undefined &&
      messages.length === 0 &&
      !hasProcessedInitialMessage.current
    ) {
      hasProcessedInitialMessage.current = true;
      const decodedMessage = decodeURIComponent(initialMessage);
      handleSendMessage(decodedMessage);

      // Clear the query param to avoid re-processing
      router.setParams({ initialMessage: undefined });
    }
  }, [initialMessage, conversation, messages, pendingMessage]);

  const handleSendMessage = async (
    content: string,
    attachments?: ExtractedFile[],
    images?: ExtractedImage[],
  ) => {
    // Extract first item from arrays (BottomInputBar passes arrays)
    const attachment = attachments?.[0];
    const image = images?.[0];

    if (!id || !conversation || isSubmitting || isProcessing) return;

    let attachmentIds: Id<"attachments">[] | undefined;

    if (attachment) {
      try {
        setIsSubmitting(true);
        const attachmentId = await createAttachment({
          conversationId,
          fileName: attachment.name,
          fileType: attachment.type,
          extractedText: attachment.text,
        });
        attachmentIds = [attachmentId];
      } catch (err) {
        console.error("Failed to save attachment:", err);
        setError("Failed to upload file attachment.");
        setIsSubmitting(false);
        return;
      }
    }

    setError(null);
    setIsSubmitting(true);

    // Context is for the LLM (hidden from user)
    // Content is for the User (displayed in chat)
    let context: string | undefined = undefined;
    let displayContent = content;
    let attachmentType: "image" | "text_file" | undefined = undefined;

    if (attachment) {
      context = `The user has attached a file "${attachment.name}". \n\nCONTENT OF FILE:\n${attachment.text}`;
      attachmentType = "text_file";
      if (!displayContent) {
        displayContent = "Please analyze this file.";
      }
    } else if (image) {
      attachmentType = "image";
      if (!displayContent) {
        displayContent = "Please analyze this image.";
      }
    }

    try {
      console.log("[ChatScreen] Sending message:", {
        hasImage: !!image,
        hasAttachment: !!attachment,
        attachmentType,
        contentLength: displayContent.length,
      });

      const systemPrompt = activePresetId 
        ? (customSystemPrompts[activePresetId] ?? PRESETS[activePresetId]?.system_prompt)
        : undefined;

      const rawHistory = messages
        ?.filter((m: any) => m.role === "user" || m.role === "assistant")
        .map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content || "" }))
        .slice(-10);

      const result = await runCouncil({
        conversationId,
        content: displayContent,
        context: context,
        attachmentIds,
        councilMembers: councilModels.length > 0 ? councilModels : undefined,
        chairmanModel: chairmanModel || undefined,
        // Pass image info for vision processing
        imageBase64: image?.base64,
        imageMimeType: image?.type,
        systemPrompt,
        history: rawHistory,
      });

      console.log("[ChatScreen] runCouncil result:", result);

      if (!result.success) {
        throw new Error(result.error || "Council processing failed");
      }
    } catch (err: any) {
      console.error("Failed to process message:", err);
      setError(err.message || "Council connection failed");
      
      // 1. Delete the assistant placeholder/error message from Convex DB
      if (messages) {
        const lastAssistantMsg = [...messages].reverse().find((m: any) => m.role === "assistant");
        if (lastAssistantMsg && (lastAssistantMsg.processing || lastAssistantMsg.error)) {
          try {
            await deleteMessage({ id: lastAssistantMsg._id });
          } catch (deleteErr) {
            console.error("Failed to delete assistant placeholder:", deleteErr);
          }
        }
      }

      // 2. Mark the corresponding user message as failed
      if (messages) {
        const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
        if (lastUserMsg) {
          setFailedUserMessages(prev => ({
            ...prev,
            [lastUserMsg._id]: {
              prompt: content,
              attachment,
              image,
            }
          }));
        }
      }

      setCanRetry(true);
      setLastMessage({ content, attachment, image });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetryMessage = useCallback(async (originalPrompt: string, failedMessageId: string) => {
    // Get the cached media attachment/image info
    const failedInfo = failedUserMessages[failedMessageId];
    const attachment = failedInfo?.attachment;
    const image = failedInfo?.image;

    // Clear from failed record
    setFailedUserMessages(prev => {
      const copy = { ...prev };
      delete copy[failedMessageId];
      return copy;
    });

    // Remove from local list to instantly update UI
    setMessagesList(prev => prev.filter(msg => (msg._id || msg.id) !== failedMessageId));
    
    // Delete the failed user message from Convex database
    if (failedMessageId) {
      try {
        await deleteMessage({ id: failedMessageId as Id<"messages"> });
      } catch (err) {
        console.error("Failed to delete user message:", err);
      }
    }

    setError(null);
    setCanRetry(false);
    
    // Automatically re-pass the saved prompt text string back into primary generation request lifecycle smoothly
    await handleSendMessage(
      originalPrompt,
      attachment ? [attachment] : undefined,
      image ? [image] : undefined
    );
  }, [failedUserMessages, deleteMessage]);

  const handleRetry = () => {
    if (lastMessage) {
      setError(null);
      setCanRetry(false);
      handleSendMessage(
        lastMessage.content,
        lastMessage.attachment ? [lastMessage.attachment] : undefined,
        lastMessage.image ? [lastMessage.image] : undefined,
      );
    }
  };

  const renderMessage = useCallback(
    ({ item, index }: { item: any; index: number }) => (
      <FadeInView delay={index > 0 ? 0 : 300}>
        <MessageBubble
          message={item}
          onImagePress={(uri: string) => setFullscreenImage(uri)}
          onRetryTrigger={handleRetryMessage}
        />
      </FadeInView>
    ),
    [handleRetryMessage],
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#20c997" />
        <Text className="text-muted-foreground mt-4">
          Connecting to cloud...
        </Text>
      </View>
    );
  }

  if (conversation === null) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Chat session not found</Text>
      </View>
    );
  }

  // Padding to prevent messages from being hidden behind input bar
  const inputBarHeight = 120 + insets.bottom;
  const isWeb = Platform.OS === "web";

  return (
    <View className="flex-1 bg-background">
      <View className={`flex-1 w-full ${isWeb ? "max-w-3xl mx-auto px-4 relative" : ""}`}>
        <View className="flex-1">
          {error && (
            <Banner
              message={error}
              onDismiss={() => {
                setError(null);
                setCanRetry(false);
              }}
              action={
                canRetry ? { label: "Retry", onPress: handleRetry } : undefined
              }
            />
          )}

          <FlatList
            ref={flatListRef}
            data={messagesList}
            keyExtractor={(item) => (item as any)._id || (item as any).id || String(Math.random())}
            renderItem={renderMessage}
            contentContainerStyle={{
              padding: 16,
              paddingBottom: inputBarHeight,
            }}
            style={{ flex: 1 }}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            initialNumToRender={15}
            windowSize={21}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-20">
                <View className="w-24 h-24 bg-secondary rounded-full items-center justify-center mb-6">
                  <MessageSquare size={48} color="#20c997" />
                </View>
                <Text className="text-foreground text-center mt-4 text-lg font-bold">
                  Ask the Council
                </Text>
                <Text className="text-muted-foreground text-center mt-2 px-8">
                  Ask a question to get answers from the LLM Council
                </Text>
              </View>
            }
          />

          {isProcessing && (
            <View
              className="absolute left-0 right-0 bg-secondary border-t border-border px-4 py-2"
              style={{ bottom: inputBarHeight - insets.bottom }}
            >
              <View className="flex-row items-center">
                <ActivityIndicator size="small" color="#20c997" />
                <Text className="ml-2 text-primary text-sm font-medium">
                  {currentStage === "vision" &&
                    "👁 Analyzing image with vision model…"}
                  {currentStage === 1 && "Stage 1: Collecting responses..."}
                  {currentStage === 2 && "Stage 2: Council is deliberating..."}
                  {currentStage === 3 && "Stage 3: Chairman is synthesizing..."}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Unified Input Bar with animated keyboard handling */}
        <BottomInputBar
          onSend={handleSendMessage}
          disabled={isProcessing || isSubmitting}
          councilModelsCount={councilModels.length}
          chairmanModel={chairmanModel}
          activePresetId={activePresetId}
          onSearchPress={() => setShowPresets(true)}
        />
      </View>

      {/* Quick Presets Modal */}
      <PresetsModal
        visible={showPresets}
        onClose={() => setShowPresets(false)}
      />

      <FullscreenImageModal
        visible={!!fullscreenImage}
        imageUri={fullscreenImage}
        onClose={() => setFullscreenImage(null)}
      />
    </View>
  );
}

export default ChatScreen;
