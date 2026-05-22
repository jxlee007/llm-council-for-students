import {
  View,
  Text,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  useWindowDimensions,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Bot, Copy, Check, ChevronDown, ChevronUp, RefreshCw } from "lucide-react-native";
import type { Message, AssistantMessage, AggregateRanking } from "../lib/types";
import CouncilResponse from "./CouncilResponse";
import React, { useState } from "react";
import { FileChip } from "./FileChip";
import * as Clipboard from "expo-clipboard";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
 * User messages: Right-aligned, sophisticated muted slate-800, rounded-tr-none.
 * Assistant messages: Left-aligned, renders council visualization or muted error card.
 */
function MessageBubble({
  message,
  aggregateRankings,
  onImagePress,
  onRetryTrigger,
}: MessageBubbleProps) {
  const { width } = useWindowDimensions();
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showExpandToggle, setShowExpandToggle] = useState(false);

  const handleCopy = async (text: string) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const handleTextLayout = (e: any) => {
    if (e.nativeEvent.lines.length > 8) {
      setShowExpandToggle(true);
    }
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
      <View className="items-end mb-4 w-full">
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
              overflow: "hidden",
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.08)",
              width: imageWidth,
            }}
          >
            <Image
              source={{ uri: imageUri }}
              style={{
                width: "100%",
                height: 250,
              }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}

        {/* Render text bubble if content exists or if no image (placeholder) */}
        {(message.content || !imageUri) && (
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", maxWidth: "90%", alignSelf: "flex-end" }}>
            {/* Interactive Retry Icon (renders dynamically OUTSIDE and immediately BESIDE the user bubble) */}
            {isFailed && onRetryTrigger && (
              <TouchableOpacity
                onPress={() =>
                  onRetryTrigger(
                    message.errorDetails || message.content || "",
                    (message as any)._id || ""
                  )
                }
                style={{
                  marginRight: 10,
                  padding: 8,
                  borderRadius: 20,
                  backgroundColor: "rgba(239, 68, 68, 0.08)",
                  borderWidth: 1,
                  borderColor: "rgba(239, 68, 68, 0.25)",
                }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.7}
              >
                <RefreshCw size={14} color="#ef4444" />
              </TouchableOpacity>
            )}

            {/* User Bubble Container */}
            <View style={{ flexShrink: 1, alignItems: "flex-end" }}>
              <Text
                onTextLayout={handleTextLayout}
                style={{
                  position: "absolute",
                  opacity: 0,
                  left: -9999,
                  fontSize: 15,
                  lineHeight: 22,
                }}
              >
                {message.content}
              </Text>

              <TouchableOpacity
                onPress={showExpandToggle ? toggleExpand : undefined}
                activeOpacity={showExpandToggle ? 0.85 : 1}
                style={{
                  backgroundColor: "#1e293b", // Sophisticated muted slate-800 background
                  borderRadius: 18,
                  borderTopRightRadius: 0,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.08)", // Stable, standard neutral border layout
                }}
              >
                <Text
                  numberOfLines={isExpanded ? undefined : 8}
                  style={{
                    color: "#f8fafc", // High contrast readable light slate
                    fontSize: 15,
                    lineHeight: 22,
                  }}
                >
                  {message.content}
                </Text>

                {/* Chevron Toggle inside bubble */}
                {showExpandToggle && (
                  <TouchableOpacity
                    onPress={toggleExpand}
                    style={{
                      alignSelf: "flex-end",
                      marginTop: 6,
                      padding: 4,
                      borderRadius: 12,
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                    }}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    activeOpacity={0.7}
                  >
                    {isExpanded ? (
                      <ChevronUp size={14} color="#94a3b8" />
                    ) : (
                      <ChevronDown size={14} color="#94a3b8" />
                    )}
                  </TouchableOpacity>
                )}
              </TouchableOpacity>

              {/* Minimalist low-opacity action row below user bubble */}
              <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 4, marginRight: 2, opacity: 0.5 }}>
                <TouchableOpacity
                  onPress={() => handleCopy(message.content || "")}
                  style={{ padding: 4 }}
                  activeOpacity={0.7}
                >
                  {copied ? (
                    <Check size={12} color="#34d399" />
                  ) : (
                    <Copy size={12} color="#94a3b8" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
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
      <View className="items-start mb-4 w-full">
        <View
          style={{
            backgroundColor: "#181d24", // Muted neutral background
            borderRadius: 18,
            borderTopLeftRadius: 0,
            padding: 12,
            maxWidth: "85%",
            borderWidth: 1,
            borderColor: "rgba(239, 68, 68, 0.4)", // Thin, clean muted-red border (status indicator)
          }}
        >
          <Text style={{ color: "#f8fafc", fontSize: 15, lineHeight: 22 }}>
            {errorBubbleMsg}
          </Text>
        </View>

        {/* Minimalist copy button row below failed AI bubble */}
        <View style={{ flexDirection: "row", justifyContent: "flex-start", marginTop: 4, marginLeft: 4, opacity: 0.5 }}>
          <TouchableOpacity
            onPress={() => handleCopy(errorBubbleMsg)}
            style={{ padding: 4 }}
            activeOpacity={0.7}
          >
            {copied ? (
              <Check size={12} color="#34d399" />
            ) : (
              <Copy size={12} color="#94a3b8" />
            )}
          </TouchableOpacity>
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
    <View style={{ marginBottom: 16, width: "100%" }}>
      <View style={{ width: "100%" }}>
        <CouncilResponse
          stage1={assistantMessage.stage1}
          stage2={assistantMessage.stage2}
          stage3={assistantMessage.stage3}
          aggregateRankings={aggregateRankings}
        />
      </View>
      {copyText ? (
        <View style={{ flexDirection: "row", justifyContent: "flex-start", marginTop: 4, marginLeft: 2, opacity: 0.5 }}>
          <TouchableOpacity
            onPress={() => handleCopy(copyText)}
            style={{ padding: 4 }}
            activeOpacity={0.7}
          >
            {copied ? (
              <Check size={12} color="#34d399" />
            ) : (
              <Copy size={12} color="#94a3b8" />
            )}
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

export default React.memo(MessageBubble);
