import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { MessageSquare } from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUIStore } from "../../lib/store";
import { sendMessage } from "../../lib/api";
import type {
  Message,
  AssistantMessage,
  AggregateRanking,
} from "../../lib/types";
import { ExtractedFile } from "../../lib/files";
import BottomInputBar from "../../components/BottomInputBar";
import MessageBubble from "../../components/MessageBubble";
import { Banner } from "../../components/Banner";
import { FadeInView } from "../../components/FadeInView";
import { Id } from "../../convex/_generated/dataModel";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Chat screen using unified BottomInputBar with animated keyboard handling.
 */
function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const conversationId = id as Id<"conversations">;
  const conversation = useQuery(api.conversations.get, { id: conversationId });
  const messages = useQuery(api.messages.list, { conversationId });
  const sendUserMessage = useMutation(api.messages.send);
  const addAssistantResponse = useMutation(api.messages.addAssistantResponse);
  const updateTitleInDB = useMutation(api.conversations.updateTitle);
  const createAttachment = useMutation(api.attachments.create);

  const { councilModels, chairmanModel } = useUIStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState<0 | 1 | 2 | 3>(0);
  const [aggregateRankings, setAggregateRankings] = useState<
    AggregateRanking[]
  >([]);
  const [pendingResponse, setPendingResponse] =
    useState<Partial<AssistantMessage> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (flatListRef.current && (messages?.length || pendingResponse)) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages?.length, pendingResponse]);

  const handleSendMessage = async (
    content: string,
    attachment?: ExtractedFile
  ) => {
    if (!id || !conversation) return;

    let attachmentId: Id<"attachments"> | undefined;

    if (attachment) {
      try {
        attachmentId = await createAttachment({
          conversationId,
          fileName: attachment.name,
          fileType: attachment.type,
          extractedText: attachment.text,
        });
      } catch (err) {
        console.error("Failed to save attachment:", err);
        setError("Failed to upload file attachment.");
        return;
      }
    }

    try {
      await sendUserMessage({
        conversationId,
        content:
          content || (attachment ? `[Attached File: ${attachment.name}]` : ""),
        attachmentIds: attachmentId ? [attachmentId] : undefined,
      });
    } catch (err) {
      console.error("Failed to save user message:", err);
      setError("Failed to save message to cloud.");
      return;
    }

    setIsProcessing(true);
    setCurrentStage(1);
    setPendingResponse({
      role: "assistant",
      stage1: [],
      stage2: [],
      stage3: { model: "", response: "" },
    });
    setAggregateRankings([]);
    setError(null);

    try {
      const { loadApiKey } = useUIStore.getState();
      const apiKey = await loadApiKey();

      let prompt = content;
      if (attachment) {
        prompt = `The user has attached a file "${attachment.name}". \n\nCONTENT OF FILE:\n${attachment.text}\n\nUSER QUESTION: ${content || "Please analyze this file."}`;
      }

      const response = await sendMessage(
        id,
        prompt,
        apiKey,
        councilModels.length > 0 ? councilModels : undefined,
        chairmanModel
      );

      setCurrentStage(3);
      setPendingResponse({
        role: "assistant",
        stage1: response.stage1,
        stage2: response.stage2,
        stage3: response.stage3,
      });

      await addAssistantResponse({
        conversationId,
        content: response.stage3.response,
        stage1: response.stage1,
        stage2: response.stage2,
        stage3: response.stage3,
      });

      if (response.metadata?.aggregate_rankings) {
        setAggregateRankings(response.metadata.aggregate_rankings);
      }

      if (
        (response.metadata as any)?.title &&
        conversation.title === "New Chat"
      ) {
        await updateTitleInDB({
          id: conversationId,
          title: (response.metadata as any).title,
        });
      }

      setPendingResponse(null);
    } catch (err: any) {
      console.error("Failed to process message:", err);
      setError(err.message || "Council connection failed");
      setPendingResponse(null);
    } finally {
      setIsProcessing(false);
      setCurrentStage(0);
    }
  };

  const renderMessage = useCallback(
    ({ item, index }: { item: Message; index: number }) => (
      <FadeInView delay={index > 0 ? 0 : 300}>
        <MessageBubble
          message={item}
          aggregateRankings={
            (item as any) === pendingResponse ? aggregateRankings : undefined
          }
        />
      </FadeInView>
    ),
    [pendingResponse, aggregateRankings]
  );

  const getDisplayMessages = (): Message[] => {
    const displayMessages = [...(messages || [])] as any[];
    if (pendingResponse && isProcessing) {
      displayMessages.push(pendingResponse as AssistantMessage);
    }
    return displayMessages;
  };

  if (conversation === undefined || messages === undefined) {
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

  return (
    <View className="flex-1 bg-background">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1">
          {error && <Banner message={error} onDismiss={() => setError(null)} />}

          <FlatList
            ref={flatListRef}
            data={getDisplayMessages()}
            keyExtractor={(item, index) =>
              (item as any)._id || index.toString()
            }
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
                  {currentStage === 1 && "Stage 1: Collecting responses..."}
                  {currentStage === 2 && "Stage 2: Council is deliberating..."}
                  {currentStage === 3 && "Stage 3: Chairman is synthesizing..."}
                </Text>
              </View>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>

      {/* Unified Input Bar with animated keyboard handling */}
      <BottomInputBar onSend={handleSendMessage} disabled={isProcessing} />
    </View>
  );
}

export default ChatScreen;
