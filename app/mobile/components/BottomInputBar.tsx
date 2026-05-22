import { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Animated,
  Keyboard,
  Platform,
  Alert,
  ScrollView,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { Plus, Send, WifiOff } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Network from "expo-network";
import {
  pickAndExtractDocument,
  pickImage,
  ExtractedFile,
  ExtractedImage,
} from "../lib/files";
import { FileChip } from "./FileChip";
import { ImageChip } from "./ImageChip";
import { AttachmentModal } from "./AttachmentModal";
import { PRESETS } from "../lib/presets";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface BottomInputBarProps {
  onSend: (
    message: string,
    attachments?: ExtractedFile[],
    images?: ExtractedImage[],
  ) => void;
  disabled?: boolean;
  councilModelsCount?: number;
  chairmanModel?: string | null;
  activePresetId?: string | null;
  onSearchPress?: () => void;
}

const MAX_ATTACHMENTS = 4;

/**
 * Focus-driven, dynamically expanding chat bottom bar.
 * Collapses to a single inline line when unfocused; expands up to 5-6 lines when focused.
 */
export default function BottomInputBar({
  onSend,
  disabled = false,
  councilModelsCount = 0,
  chairmanModel = null,
  activePresetId = null,
  onSearchPress,
}: BottomInputBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<ExtractedFile[]>([]);
  const [images, setImages] = useState<ExtractedImage[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const MAX_CHARS = 2000;

  // Total number of attachments
  const totalAttachments = attachments.length + images.length;

  // Animated value for keyboard offset
  const keyboardOffset = useRef(new Animated.Value(0)).current;

  // Check network connectivity
  useEffect(() => {
    const checkNetwork = async () => {
      try {
        const status = await Network.getNetworkStateAsync();
        setIsOnline(status.isConnected ?? true);
      } catch {
        setIsOnline(true);
      }
    };
    checkNetwork();
    const interval = setInterval(checkNetwork, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      Animated.timing(keyboardOffset, {
        toValue: e.endCoordinates.height,
        duration: Platform.OS === "ios" ? 250 : 150,
        useNativeDriver: true,
      }).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      Animated.timing(keyboardOffset, {
        toValue: 0,
        duration: Platform.OS === "ios" ? 250 : 150,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardOffset]);

  const handleFocus = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsFocused(true);
  };

  const handleBlur = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsFocused(false);
  };

  const handleSend = () => {
    const trimmed = message.trim();
    console.log("[BottomInputBar] handleSend called:", {
      message: trimmed,
      attachmentsCount: attachments.length,
      imagesCount: images.length,
    });
    if ((trimmed || totalAttachments > 0) && !disabled && isOnline) {
      onSend(
        trimmed,
        attachments.length > 0 ? attachments : undefined,
        images.length > 0 ? images : undefined,
      );
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setMessage("");
      setAttachments([]);
      setImages([]);
      inputRef.current?.blur();
    }
  };

  const effectivelyDisabled = disabled || !isOnline;

  const handleFilePick = async () => {
    if (totalAttachments >= MAX_ATTACHMENTS) {
      Alert.alert(
        "Attachment Limit",
        `You can attach up to ${MAX_ATTACHMENTS} files or images.`,
      );
      return;
    }

    const file = await pickAndExtractDocument();
    if (file) {
      setAttachments([...attachments, file]);
    }
  };

  const handleImagePick = async () => {
    if (totalAttachments >= MAX_ATTACHMENTS) {
      Alert.alert(
        "Attachment Limit",
        `You can attach up to ${MAX_ATTACHMENTS} files or images.`,
      );
      return;
    }

    const picked = await pickImage("gallery");
    if (picked) {
      setImages([...images, picked]);
    }
  };

  const handleCameraCapture = async () => {
    if (totalAttachments >= MAX_ATTACHMENTS) {
      Alert.alert(
        "Attachment Limit",
        `You can attach up to ${MAX_ATTACHMENTS} files or images.`,
      );
      return;
    }

    const picked = await pickImage("camera");
    if (picked) {
      setImages([...images, picked]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <Animated.View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        transform: [{ translateY: Animated.multiply(keyboardOffset, -1) }],
      }}
    >
      <View
        className="px-4 pt-3 mb-8 bg-background"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        {/* Attachments Row */}
        {totalAttachments > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-2"
            contentContainerStyle={{ gap: 8 }}
          >
            {attachments.map((file, index) => (
              <FileChip
                key={`file-${index}`}
                name={file.name}
                onRemove={() => removeAttachment(index)}
              />
            ))}
            {images.map((img, index) => (
              <ImageChip
                key={`image-${index}`}
                name={img.name}
                uri={img.uri}
                onRemove={() => removeImage(index)}
              />
            ))}
          </ScrollView>
        )}

        {/* Unified In-Line Dynamic Bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            backgroundColor: "#181d24", // Muted neutral background
            borderRadius: 24,
            borderWidth: 1,
            borderColor: isFocused ? "rgba(32, 201, 151, 0.4)" : "rgba(255, 255, 255, 0.08)",
            paddingHorizontal: 8,
            paddingVertical: 6,
          }}
        >
          {/* File Upload Icon */}
          <TouchableOpacity
            onPress={() => setShowAttachmentModal(true)}
            style={{
              width: 38,
              height: 38,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 19,
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              marginBottom: 1,
            }}
            disabled={effectivelyDisabled}
            activeOpacity={0.7}
          >
            <Plus size={18} color="#9ca3af" />
          </TouchableOpacity>

          {/* Dynamic Expanding Text Input */}
          <TextInput
            ref={inputRef}
            style={{
              flex: 1,
              color: "#f8fafc",
              fontSize: 15,
              lineHeight: 20,
              paddingHorizontal: 10,
              paddingTop: Platform.OS === "ios" ? 8 : 6,
              paddingBottom: Platform.OS === "ios" ? 8 : 6,
              minHeight: 38,
              maxHeight: isFocused ? 120 : 38, // Collapses to 38px, expands up to ~5-6 lines (120px)
            }}
            placeholder={
              isOnline ? "Ask anything..." : "Offline - Connect to send"
            }
            placeholderTextColor={isOnline ? "#6b7280" : "#ef4444"}
            value={message}
            onChangeText={setMessage}
            multiline
            onFocus={handleFocus}
            onBlur={handleBlur}
            maxLength={MAX_CHARS}
            editable={!effectivelyDisabled}
          />

          {/* AI Mode Dropdown/Pill */}
          <TouchableOpacity
            onPress={onSearchPress}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 16,
              backgroundColor: "rgba(32, 201, 151, 0.1)",
              marginRight: 6,
              marginBottom: 1,
              alignItems: "center",
              justifyContent: "center",
              height: 38,
            }}
            disabled={effectivelyDisabled}
            activeOpacity={0.7}
          >
            <Text style={{ color: "#20c997", fontSize: 12, fontWeight: "600" }}>
              {activePresetId && PRESETS[activePresetId]
                ? PRESETS[activePresetId].label.split(" ")[0] // Compact label
                : "Custom"}
            </Text>
          </TouchableOpacity>

          {/* Send Button */}
          <TouchableOpacity
            onPress={handleSend}
            disabled={
              (!message.trim() && totalAttachments === 0) ||
              effectivelyDisabled
            }
            style={{
              width: 38,
              height: 38,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 19,
              backgroundColor:
                (message.trim() || totalAttachments > 0) && !effectivelyDisabled
                  ? "#20c997"
                  : "rgba(255, 255, 255, 0.05)",
              marginBottom: 1,
            }}
            activeOpacity={0.7}
          >
            {disabled ? (
              <ActivityIndicator size="small" color="#0f1419" />
            ) : !isOnline ? (
              <WifiOff size={16} color="#ef4444" />
            ) : (
              <Send size={16} color="#0f1419" />
            )}
          </TouchableOpacity>
        </View>

        {/* Character Count Indicator (subtle, visible under focus) */}
        {isFocused && message.length > 0 && (
          <Text
            style={{
              textAlign: "right",
              fontSize: 10,
              color: "#6b7280",
              marginTop: 4,
              marginRight: 8,
            }}
          >
            {message.length}/{MAX_CHARS}
          </Text>
        )}
      </View>

      {/* Attachment Modal */}
      <AttachmentModal
        visible={showAttachmentModal}
        onClose={() => setShowAttachmentModal(false)}
        onSelectImage={handleImagePick}
        onSelectCamera={handleCameraCapture}
        onSelectFile={handleFilePick}
      />
    </Animated.View>
  );
}
