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
import { getConversation, sendMessageStream } from "../../../lib/api";
import type { Message, AssistantMessage, UserMessage, AggregateRanking } from "../../../lib/types";
import ChatInput from "../../../components/ChatInput";
import MessageBubble from "../../../components/MessageBubble";
import { Banner } from "../../../components/Banner";
import { FadeInView } from "../../../components/FadeInView";

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
        councilModels,
        chairmanModel
    } = useStore();

    const [isLoading, setIsLoading] = useState(true);
    const [pendingResponse, setPendingResponse] = useState<Partial<AssistantMessage> | null>(null);
    const [error, setError] = useState<string | null>(null);

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

    // Send message handler with Streaming
    const handleSendMessage = async (content: string) => {
        if (!id || !currentConversation) return;

        // Add user message immediately
        const userMessage: UserMessage = { role: "user", content };
        addMessageToCurrentConversation(userMessage);

        // Start processing
        setIsProcessing(true);
        setCurrentStage(1);
        setPendingResponse({ role: "assistant", stage1: [], stage2: [], stage3: { model: "", response: "" } });
        setError(null);

        try {
            // Load API key from store for BYOK
            const { loadApiKey } = useStore.getState();
            const apiKey = await loadApiKey();

            // Stream from backend
            const stream = sendMessageStream(
                id,
                content,
                apiKey,
                councilModels.length > 0 ? councilModels : undefined,
                chairmanModel
            );

            let stage1_results: any[] = [];
            let stage2_results: any[] = [];
            let stage3_result: any = { model: "", response: "" };
            let metadata: any = {};

            for await (const event of stream) {
                if (event.type === 'error') {
                    throw new Error(event.message || 'Stream error');
                }

                if (event.type === 'stage1_start') setCurrentStage(1);
                if (event.type === 'stage2_start') setCurrentStage(2);
                if (event.type === 'stage3_start') setCurrentStage(3);

                if (event.type === 'stage1_complete') {
                    stage1_results = event.data as any[];
                    setPendingResponse(prev => ({ ...prev, stage1: stage1_results }));
                }

                if (event.type === 'stage2_complete') {
                    stage2_results = event.data as any[];
                    metadata = event.metadata || {};
                    setPendingResponse(prev => ({ ...prev, stage2: stage2_results }));
                    if (metadata.aggregate_rankings) {
                        setAggregateRankings(metadata.aggregate_rankings);
                    }
                }

                if (event.type === 'stage3_complete') {
                    stage3_result = event.data as any;
                    setPendingResponse(prev => ({ ...prev, stage3: stage3_result }));
                }

                if (event.type === 'title_complete') {
                    const titleData = event.data as any;
                    if (titleData?.title) {
                        updateConversationTitle(id, titleData.title);
                    }
                }
            }

            // Build final assistant message
            const assistantMessage: AssistantMessage = {
                role: "assistant",
                stage1: stage1_results,
                stage2: stage2_results,
                stage3: stage3_result,
            };

            addMessageToCurrentConversation(assistantMessage);
            setPendingResponse(null);

        } catch (err: any) {
            console.error("Failed to send message:", err);
            setError(err.message || "Connection failed");
            setPendingResponse(null);
            // Revert state if needed or just show error
        } finally {
            setIsProcessing(false);
            setCurrentStage(0);
        }
    };

    // Render message item
    const renderMessage = ({ item, index }: { item: Message; index: number }) => (
        <FadeInView delay={index > 0 ? 0 : 300}>
            <MessageBubble message={item} />
        </FadeInView>
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
            {error && <Banner message={error} onDismiss={() => setError(null)} />}

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
                            {currentStage === 1 && "Stage 1: Collecting responses..."}
                            {currentStage === 2 && "Stage 2: Council is deliberating..."}
                            {currentStage === 3 && "Stage 3: Chairman is synthesizing..."}
                        </Text>
                    </View>
                </View>
            )}

            <ChatInput onSend={handleSendMessage} disabled={isProcessing} />
        </KeyboardAvoidingView>
    );
}
