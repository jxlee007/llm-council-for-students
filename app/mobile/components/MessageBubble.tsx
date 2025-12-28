import { View, Text, ActivityIndicator } from "react-native";
import { User, Bot } from "lucide-react-native";
import type { Message, AssistantMessage } from "../lib/types";
import CouncilResponse from "./CouncilResponse";

interface MessageBubbleProps {
    message: Message;
}

/**
 * Message bubble component.
 * User messages: Right-aligned, blue background.
 * Assistant messages: Left-aligned, renders council visualization.
 */
export default function MessageBubble({ message }: MessageBubbleProps) {
    if (message.role === "user") {
        return (
            <View className="flex-row justify-end mb-4">
                <View className="bg-user rounded-2xl rounded-br-md px-4 py-3 max-w-[85%] flex-row items-start">
                    <Text className="text-white text-base leading-6 flex-1">
                        {message.content}
                    </Text>
                    <View className="ml-2 mt-1">
                        <User size={16} color="#ffffff" />
                    </View>
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
                <View className="bg-white rounded-2xl rounded-bl-md px-4 py-3 border border-gray-100 shadow-sm flex-row items-center">
                    <View className="mr-2 p-1.5 bg-indigo-50 rounded-lg">
                        <Bot size={20} color="#4f46e5" />
                    </View>
                    <View className="flex-row items-center">
                        <ActivityIndicator size="small" color="#4f46e5" />
                        <Text className="ml-2 text-gray-500">Thinking...</Text>
                    </View>
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
            />
        </View>
    );
}
