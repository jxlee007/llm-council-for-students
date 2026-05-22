import {
  View,
  Text,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { Bot, Copy, Check } from "lucide-react-native";
import type { Message, AssistantMessage, AggregateRanking } from "../lib/types";
import CouncilResponse from "./CouncilResponse";
import React, { useState } from "react";
import { FileChip } from "./FileChip";
import * as Clipboard from "expo-clipboard";

interface MessageBubbleProps {
  message: Message & {
    status?: "loading" | "success" | "failed";
    errorDetails?: string;
  };
  aggregateRankings?: AggregateRanking[];
  onImagePress?: (base64: string) => void;
  onRetryTrigger?: (originalPrompt: string, failedMessageId: string) => void;
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
  onRetryTrigger,
}: MessageBubbleProps) {
  const { width } = useWindowDimensions();
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
    const isFailed = message.status === "failed";

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
              borderColor: isFailed ? '#fca5a5' : '#e5e7eb', // error border or regular border
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
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", maxWidth: "85%" }}>
            <TouchableOpacity
              onPress={() => handleCopy(message.content || "")}
              style={{
                marginRight: 8,
                padding: 8,
                borderRadius: 20,
                backgroundColor: "rgba(255,255,255,0.06)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.1)",
              }}
              activeOpacity={0.7}
            >
              {copied ? (
                <Check size={14} color="#34d399" />
              ) : (
                <Copy size={14} color="#94a3b8" />
              )}
            </TouchableOpacity>

            <View
                style={{
                    backgroundColor: isFailed ? "#fee2e2" : "#2ecc71", // Light red if failed, Green if normal
                    borderRadius: 18,
                    borderTopRightRadius: 0,
                    padding: 12,
                    flexShrink: 1,
                    borderWidth: isFailed ? 1 : 0,
                    borderColor: "#fca5a5",
                }}
            >
              <Text style={{ color: isFailed ? "#ef4444" : "#ffffff", fontSize: 16, lineHeight: 24 }}>
                {message.content}
              </Text>
            </View>
          </View>
        )}

        {isFailed && onRetryTrigger && (
          <TouchableOpacity
            onPress={() =>
              onRetryTrigger(
                message.errorDetails || message.content || "",
                (message as any)._id || ""
              )
            }
            style={{ marginTop: 6, marginRight: 4, flexDirection: "row", alignItems: "center" }}
            activeOpacity={0.7}
          >
            <Text style={{ color: "#ef4444", fontSize: 13, fontWeight: "600" }}>
              ⚠️ Connection failed. Tap to Retry Request
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Assistant message with council response
  const assistantMessage = message as AssistantMessage & {
    status?: "loading" | "success" | "failed";
    error?: string;
    errorDetails?: string;
    _id?: string;
  };

  // Check failed state
  const isFailed = assistantMessage.status === "failed" || !!assistantMessage.error;

  // Check if this is a pending/loading message
  const isLoading =
    assistantMessage.status === "loading" ||
    (!isFailed && (!assistantMessage.stage1 || assistantMessage.stage1.length === 0));

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

  if (isFailed) {
    const errorBubbleMsg = assistantMessage.content || "Sorry, I encountered a temporary connection issue while consulting the council. Please check your network or try again.";
    
    return (
      <View className="items-start mb-4">
        <View
          style={{
            backgroundColor: "#fee2e2", // Light red/pinkish background
            borderRadius: 18,
            borderTopLeftRadius: 0,
            padding: 12,
            maxWidth: "85%",
            borderWidth: 1,
            borderColor: "#fca5a5", // Light red border
          }}
        >
          <Text style={{ color: "#ef4444", fontSize: 15, lineHeight: 22 }}>
            {errorBubbleMsg}
          </Text>
        </View>
      </View>
    );
  }

  const getAssistantCopyText = () => {
    if (assistantMessage.stage3?.response) {
      return assistantMessage.stage3.response;
    }
    if (assistantMessage.stage1 && assistantMessage.stage1.length > 0) {
      return assistantMessage.stage1.map(s => `[${s.model}]: ${s.response}`).join("\n\n");
    }
    return "";
  };

  const copyText = getAssistantCopyText();

  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", marginBottom: 16 }}>
      <View style={{ flex: 1 }}>
        <CouncilResponse
          stage1={assistantMessage.stage1}
          stage2={assistantMessage.stage2}
          stage3={assistantMessage.stage3}
          aggregateRankings={aggregateRankings}
        />
      </View>
      {copyText ? (
        <TouchableOpacity
          onPress={() => handleCopy(copyText)}
          style={{
            marginLeft: 8,
            padding: 8,
            borderRadius: 20,
            backgroundColor: "rgba(255,255,255,0.06)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.1)",
            marginBottom: 8,
          }}
          activeOpacity={0.7}
        >
          {copied ? (
            <Check size={14} color="#34d399" />
          ) : (
            <Copy size={14} color="#94a3b8" />
          )}
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default React.memo(MessageBubble);
