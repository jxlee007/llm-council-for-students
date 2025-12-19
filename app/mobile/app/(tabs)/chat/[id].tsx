import { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useStore, loadConversationFromStorage } from "../../../lib/store";
import { getConversation, sendMessage } from "../../../lib/api";
import type { Message, AssistantMessage, UserMessage, AggregateRanking } from "../../../lib/types";
import ChatInput from "../../../components/ChatInput";
import MessageBubble from "../../../components/MessageBubble";

/**
 * Main chat screen for a conversation.
 * Displays messages and handles the 3-stage council response.
 */
export default function ChatScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const navigation = useNavigation();
    const flatListRef = useRef<FlatList>(null);

    const {
        currentConversation,
        setCurrentConversation,
        addMessageToCurrentConversation,
        isProcessing,
        setIsProcessing,
        currentStage,
        setCurrentStage,
        setAggregateRankings,
        saveConversationToStorage,
        updateConversationTitle,
    } = useStore();

    const [isLoading, setIsLoading] = useState(true);
    const [pendingResponse, setPendingResponse] = useState<Partial<AssistantMessage> | null>(null);

    // Load conversation on mount
    useEffect(() => {
        const loadConversation = async () => {
            if (!id) return;

            setIsLoading(true);

            // Try local storage first
            let conversation = await loadConversationFromStorage(id);

            // Fallback to backend
            if (!conversation) {
                try {
                    conversation = await getConversation(id);
                } catch (error) {
                    console.error("Failed to load conversation:", error);
                }
            }

            if (conversation) {
                setCurrentConversation(conversation);
                navigation.setOptions({ title: conversation.title });
            }

            setIsLoading(false);
        };

        loadConversation();
    }, [id]);

    // Update header title when conversation changes
    useEffect(() => {
        if (currentConversation?.title) {
            navigation.setOptions({ title: currentConversation.title });
        }
    }, [currentConversation?.title]);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        if (flatListRef.current && currentConversation?.messages.length) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [currentConversation?.messages.length, pendingResponse]);

    // Send message handler
    const handleSendMessage = async (content: string) => {
        if (!id || !currentConversation) return;

        // Add user message immediately
        const userMessage: UserMessage = { role: "user", content };
        addMessageToCurrentConversation(userMessage);

        // Start processing
        setIsProcessing(true);
        setCurrentStage(1);
        setPendingResponse({ role: "assistant" });

        try {
            // Load API key from store for BYOK
            const { loadApiKey } = useStore.getState();
            const apiKey = await loadApiKey();

            // Send to backend with API key
            const response = await sendMessage(id, content, apiKey);

            // Build assistant message
            const assistantMessage: AssistantMessage = {
                role: "assistant",
                stage1: response.stage1,
                stage2: response.stage2,
                stage3: response.stage3,
            };

            // Update state
            setAggregateRankings(response.metadata.aggregate_rankings);
            addMessageToCurrentConversation(assistantMessage);
            setPendingResponse(null);

            // Update title if this was the first message
            if (currentConversation.messages.length <= 1) {
                // The backend should have updated the title, refresh conversation
                try {
                    const updated = await getConversation(id);
                    if (updated.title !== currentConversation.title) {
                        updateConversationTitle(id, updated.title);
                    }
                } catch {
                    // Ignore title update failures
                }
            }
        } catch (error) {
            console.error("Failed to send message:", error);
            // TODO: Show error toast and allow retry
            setPendingResponse(null);
        } finally {
            setIsProcessing(false);
            setCurrentStage(0);
        }
    };

    // Render message item
    const renderMessage = ({ item, index }: { item: Message; index: number }) => (
        <MessageBubble message={item} key={index} />
    );

    // Get messages to display (including pending response)
    const getDisplayMessages = (): Message[] => {
        const messages = currentConversation?.messages || [];
        if (pendingResponse && isProcessing) {
            return [...messages, pendingResponse as AssistantMessage];
        }
        return messages;
    };

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50">
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text className="text-gray-500 mt-4">Loading conversation...</Text>
            </View>
        );
    }

    if (!currentConversation) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50">
                <Text className="text-gray-500">Conversation not found</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-gray-50"
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={90}
        >
            <FlatList
                ref={flatListRef}
                data={getDisplayMessages()}
                keyExtractor={(_, index) => index.toString()}
                renderItem={renderMessage}
                contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
                ListEmptyComponent={
                    <View className="flex-1 items-center justify-center py-20">
                        <Text className="text-5xl mb-4">🎓</Text>
                        <Text className="text-gray-500 text-center">
                            Ask a question to get answers from the LLM Council
                        </Text>
                    </View>
                }
            />

            {/* Processing indicator */}
            {isProcessing && (
                <View className="px-4 py-2 bg-primary-50 border-t border-primary-100">
                    <View className="flex-row items-center">
                        <ActivityIndicator size="small" color="#4f46e5" />
                        <Text className="ml-2 text-primary-700 text-sm">
                            {currentStage === 1 && "Stage 1: Collecting model responses..."}
                            {currentStage === 2 && "Stage 2: Models ranking each other..."}
                            {currentStage === 3 && "Stage 3: Chairman synthesizing final answer..."}
                        </Text>
                    </View>
                </View>
            )}

            <ChatInput onSend={handleSendMessage} disabled={isProcessing} />
        </KeyboardAvoidingView>
    );
}
