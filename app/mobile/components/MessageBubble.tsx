import {
  View,
  Text,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from "react-native";
import { Bot } from "lucide-react-native";
import type { Message, AssistantMessage, AggregateRanking } from "../lib/types";
import CouncilResponse from "./CouncilResponse";
import React from "react";

interface MessageBubbleProps {
  message: Message;
  aggregateRankings?: AggregateRanking[];
  onImagePress?: (base64: string) => void;
}

/**
 * Message bubble component.
 * User messages: Right-aligned, primary color, rounded-tr-none.
 * Assistant messages: Left-aligned, renders council visualization.
 */
function MessageBubble({
  message,
  aggregateRankings,
  onImagePress,
}: MessageBubbleProps) {
  if (message.role === "user") {
    // Debug logging
    console.log("[MessageBubble] User message:", {
      hasImageBase64: !!message.imageBase64,
      imageBase64Length: message.imageBase64?.length,
      imageBase64Preview: message.imageBase64?.substring(0, 50),
    });

    // Simple mime detection
    const isPng = message.imageBase64?.startsWith("iVBOR");
    const mimeType = isPng ? "image/png" : "image/jpeg";
    const imageUri = message.imageBase64
      ? `data:${mimeType};base64,${message.imageBase64}`
      : null;

    console.log("[MessageBubble] Image URI:", imageUri ? "CREATED" : "NULL");

    return (
      <View className="items-end mb-4">
        {imageUri && (
          <TouchableOpacity
            onPress={() => onImagePress?.(imageUri!)}
            activeOpacity={0.9}
            className="mb-1.5 rounded-xl overflow-hidden border border-border max-w-[80%]"
          >
            <Image
              source={{ uri: imageUri }}
              style={{ width: 220, height: 250 }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
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
  const isLoading =
    !assistantMessage.stage1 || assistantMessage.stage1.length === 0;

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
