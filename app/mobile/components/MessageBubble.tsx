import { View, Text, ActivityIndicator } from "react-native";
import { Bot } from "lucide-react-native";
import type { Message, AssistantMessage, AggregateRanking } from "../lib/types";
import CouncilResponse from "./CouncilResponse";
import React from "react";

interface MessageBubbleProps {
    message: Message;
    aggregateRankings?: AggregateRanking[];
}

/**
 * Message bubble component.
 * User messages: Right-aligned, primary color, rounded-tr-none.
 * Assistant messages: Left-aligned, renders council visualization.
 */
function MessageBubble({ message, aggregateRankings }: MessageBubbleProps) {
    if (message.role === "user") {
        return (
            <View className="flex-row justify-end mb-4">
                <View className="bg-primary rounded-2xl rounded-tr-none px-4 py-3 max-w-[85%]">
                    <Text className="text-primary-foreground text-base leading-6">
                        {message.content}
                    </Text>
                </View>
            </View>
        );
    }

    // Assistant message with council response
    const assistantMessage = message as AssistantMessage;

    // Check if this is a pending/loading message
    const isLoading = !assistantMessage.stage1 || assistantMessage.stage1.length === 0;

    if (isLoading) {
        return (
            <View className="flex-row justify-start mb-4">
                <View className="bg-card rounded-2xl rounded-tl-none px-4 py-3 border border-border shadow-sm flex-row items-center">
                    <View className="mr-3">
                         <ActivityIndicator size="small" color="#20c997" />
                    </View>
                    <Text className="text-muted-foreground text-sm font-medium">
                        Consulting council members...
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View className="mb-4">
            <CouncilResponse
                stage1={assistantMessage.stage1}
                stage2={assistantMessage.stage2}
                stage3={assistantMessage.stage3}
                aggregateRankings={aggregateRankings}
            />
        </View>
    );
}

export default React.memo(MessageBubble);
