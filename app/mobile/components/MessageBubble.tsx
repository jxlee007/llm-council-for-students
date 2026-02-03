import {
  View,
  Text,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { Bot } from "lucide-react-native";
import type { Message, AssistantMessage, AggregateRanking } from "../lib/types";
import CouncilResponse from "./CouncilResponse";
import React from "react";
import { FileChip } from "./FileChip";

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
  const { width } = useWindowDimensions();

  if (message.role === "user") {
    // Check for attachments (enriched via backend)
    const attachments = (message as any).attachments || [];

    // Determine image source: prioritize imageUrl, then fall back to imageBase64
    let imageUri = message.imageUrl;
    if (!imageUri && message.imageBase64) {
      const isPng = message.imageBase64.startsWith("iVBOR");
      const mimeType = isPng ? "image/png" : "image/jpeg";
      imageUri = `data:${mimeType};base64,${message.imageBase64}`;
    }

    // Styles from requirements
    // Image bubble: width min(80% screen, 280px), max-height 250px, radius 12, margin-bottom 6
    const imageWidth = Math.min(width * 0.8, 280);

    return (
      <View className="items-end mb-4">
        {/* Render Attachments */}
        {attachments.length > 0 && (
            <View className="mb-2 flex-row flex-wrap justify-end gap-2">
                {attachments.map((file: any, index: number) => (
                    <FileChip
                        key={index}
                        name={file.fileName}
                        onRemove={() => {}} // No-op for chat history
                    />
                ))}
            </View>
        )}

        {imageUri && (
          <TouchableOpacity
            onPress={() => onImagePress?.(imageUri!)}
            activeOpacity={0.9}
            style={{
              marginBottom: 6,
              borderRadius: 12,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: '#e5e7eb', // border-border
              width: imageWidth,
            }}
          >
            <Image
              source={{ uri: imageUri }}
              style={{
                width: '100%',
                height: 250,
              }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}

        {/* Render text bubble if content exists or if no image (placeholder) */}
        {(message.content || !imageUri) && (
            <View
                style={{
                    backgroundColor: "#2ecc71", // Green requirement
                    borderRadius: 18,
                    borderTopRightRadius: 0,
                    padding: 12,
                    maxWidth: "85%",
                }}
            >
              <Text style={{ color: "#ffffff", fontSize: 16, lineHeight: 24 }}>
                {message.content}
              </Text>
            </View>
        )}
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
