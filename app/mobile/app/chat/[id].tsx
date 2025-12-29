import { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    TouchableWithoutFeedback,
    Keyboard,
} from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { MessageSquare } from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUIStore } from "../../lib/store";
import { sendMessage } from "../../lib/api";
import type { Message, AssistantMessage, UserMessage, AggregateRanking } from "../../lib/types";
import { ExtractedFile } from "../../lib/files";
import ChatInput from "../../components/ChatInput";
import MessageBubble from "../../components/MessageBubble";
import { Banner } from "../../components/Banner";
import { FadeInView } from "../../components/FadeInView";
import { Id } from "../../convex/_generated/dataModel";

/**
 * Main chat screen for a conversation.
 * Displays messages from Convex and handles the 3-stage council response.
 * Styled for Dark Mode.
 */
function ChatScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const navigation = useNavigation();
    const flatListRef = useRef<FlatList>(null);

    // Convex Hooks
    const conversationId = id as Id<"conversations">;
    const conversation = useQuery(api.conversations.get, { id: conversationId });
    const messages = useQuery(api.messages.list, { conversationId });
    const sendUserMessage = useMutation(api.messages.send);
    const addAssistantResponse = useMutation(api.messages.addAssistantResponse);
    const updateTitleInDB = useMutation(api.conversations.updateTitle);
    const createAttachment = useMutation(api.attachments.create);

    const {
        councilModels,
        chairmanModel
    } = useUIStore();

    const [isProcessing, setIsProcessing] = useState(false);
    const [currentStage, setCurrentStage] = useState<0 | 1 | 2 | 3>(0);
    const [aggregateRankings, setAggregateRankings] = useState<AggregateRanking[]>([]);
    const [pendingResponse, setPendingResponse] = useState<Partial<AssistantMessage> | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Update header title
    useEffect(() => {
        if (conversation?.title) {
            navigation.setOptions({ title: conversation.title });
        }
    }, [conversation?.title]);

    // Scroll to bottom
    useEffect(() => {
        if (flatListRef.current && (messages?.length || pendingResponse)) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages?.length, pendingResponse]);

    // Send message handler
    const handleSendMessage = async (content: string, attachment?: ExtractedFile) => {
        if (!id || !conversation) return;

        let attachmentId: Id<"attachments"> | undefined;

        // 1. If attachment, save to Convex first
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

        // 2. Save user message to Convex
        try {
            await sendUserMessage({
                conversationId,
                content: content || (attachment ? `[Attached File: ${attachment.name}]` : ""),
                attachmentIds: attachmentId ? [attachmentId] : undefined,
            });
        } catch (err) {
            console.error("Failed to save user message:", err);
            setError("Failed to save message to cloud.");
            return;
        }

        // 3. Start processing
        setIsProcessing(true);
        setCurrentStage(1);
        setPendingResponse({ role: "assistant", stage1: [], stage2: [], stage3: { model: "", response: "" } });
        setAggregateRankings([]); // Reset rankings for new message
        setError(null);

        try {
            const { loadApiKey } = useUIStore.getState();
            const apiKey = await loadApiKey();

            // Prepare prompt including extracted text if available
            let prompt = content;
            if (attachment) {
                prompt = `The user has attached a file "${attachment.name}". \n\nCONTENT OF FILE:\n${attachment.text}\n\nUSER QUESTION: ${content || "Please analyze this file."}`;
            }

            // Call outdoor API for council processing
            const response = await sendMessage(
                id,
                prompt,
                apiKey,
                councilModels.length > 0 ? councilModels : undefined,
                chairmanModel
            );

            // Progressive visual feedback (simulate stages)
            setCurrentStage(2);
            setPendingResponse(prev => ({ ...prev, stage1: response.stage1 }));
            await new Promise(resolve => setTimeout(resolve, 300));
            
            setCurrentStage(3);
            setPendingResponse(prev => ({ ...prev, stage2: response.stage2 }));
            await new Promise(resolve => setTimeout(resolve, 300));
            
            setPendingResponse(prev => ({ ...prev, stage3: response.stage3 }));

            // Save final assistant response to Convex
            await addAssistantResponse({
                conversationId,
                content: response.stage3.response,
                stage1: response.stage1,
                stage2: response.stage2,
                stage3: response.stage3,
            });

            // Handle aggregate rankings if present
            if (response.metadata?.aggregate_rankings) {
                setAggregateRankings(response.metadata.aggregate_rankings);
            }

            // Handle title update
            if ((response.metadata as any)?.title && conversation.title === "New Chat") {
                await updateTitleInDB({ id: conversationId, title: (response.metadata as any).title });
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

    // Render message item
    const renderMessage = ({ item, index }: { item: Message; index: number }) => (
        <FadeInView delay={index > 0 ? 0 : 300}>
            <MessageBubble
                message={item}
                aggregateRankings={
                    (item as any) === pendingResponse ? aggregateRankings : undefined
                }
            />
        </FadeInView>
    );

    // Get messages to display
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
                <Text className="text-muted-foreground mt-4">Connecting to cloud...</Text>
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

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-background"
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View className="flex-1">
                    {error && <Banner message={error} onDismiss={() => setError(null)} />}

                    <FlatList
                        ref={flatListRef}
                        data={getDisplayMessages()}
                        keyExtractor={(item, index) => (item as any)._id || index.toString()}
                        renderItem={renderMessage}
                        contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
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

                    {/* Processing indicator */}
                    {isProcessing && (
                        <View className="px-4 py-2 bg-secondary border-t border-border">
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

                    <ChatInput onSend={handleSendMessage} disabled={isProcessing} />
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

export default ChatScreen;
