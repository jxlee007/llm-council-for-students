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
} from "react-native";
import { Plus, Search, Send, WifiOff } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Network from "expo-network";
import {
  pickAndExtractText,
  pickImage,
  ExtractedFile,
  ExtractedImage,
} from "../lib/files";
import { FileChip } from "./FileChip";
import { ImageChip } from "./ImageChip";
import { AttachmentModal } from "./AttachmentModal";
import { PRESETS } from "../lib/presets";

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
 * Unified keyboard-aware input bar using Animated translateY.
 * Listens to keyboard events and animates position.
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
        // Assume online if check fails
        setIsOnline(true);
      }
    };
    checkNetwork();
    const interval = setInterval(checkNetwork, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Use keyboardWillShow/Hide on iOS, keyboardDidShow/Hide on Android
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

  const handleSend = () => {
    const trimmed = message.trim();
    console.log("[BottomInputBar] handleSend called:", {
      message: trimmed,
      attachmentsCount: attachments.length,
      imagesCount: images.length,
      firstImageBase64Length: images[0]?.base64?.length,
    });
    if ((trimmed || totalAttachments > 0) && !disabled && isOnline) {
      onSend(
        trimmed,
        attachments.length > 0 ? attachments : undefined,
        images.length > 0 ? images : undefined,
      );
      setMessage("");
      setAttachments([]);
      setImages([]);
    }
  };

  // Compute effective disabled state
  const effectivelyDisabled = disabled || !isOnline;

  const handleFilePick = async () => {
    if (totalAttachments >= MAX_ATTACHMENTS) {
      Alert.alert(
        "Attachment Limit",
        `You can attach up to ${MAX_ATTACHMENTS} files or images.`,
      );
      return;
    }

    const file = await pickAndExtractText();
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

        <View className="bg-card rounded-2xl border border-border overflow-hidden">
          {/* Text Input */}
          <TextInput
            className="text-base text-foreground px-4 pt-4 pb-2 min-h-[60px] max-h-32"
            placeholder={
              isOnline ? "Ask anything..." : "Offline - Connect to send"
            }
            placeholderTextColor={isOnline ? "#6b7280" : "#ef4444"}
            value={message}
            onChangeText={setMessage}
            multiline
            editable={!effectivelyDisabled}
          />

          {/* Action Row */}
          <View className="flex-row items-center justify-between px-3 pb-3">
            {/* Left Icons */}
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={() => setShowAttachmentModal(true)}
                className="w-10 h-10 items-center justify-center rounded-full bg-secondary"
                disabled={effectivelyDisabled}
              >
                <Plus size={18} color="#9ca3af" />
              </TouchableOpacity>

              {/* Council Preset Pill */}
              <TouchableOpacity
                onPress={onSearchPress}
                className="bg-primary/20 px-3 py-2 rounded-full flex-row items-center  gap-2"
                disabled={effectivelyDisabled}
              >
                <Text className="text-primary text-sm font-semibold">
                  {activePresetId && PRESETS[activePresetId]
                    ? `${PRESETS[activePresetId].label} Council`
                    : "Custom"}
                </Text>
              </TouchableOpacity>
              <Text className="text-primary/60 text-md font-medium">
                {(() => {
                  // Calculate total unique models: members + chairman (if not already in members)
                  const totalModels =
                    chairmanModel && councilModelsCount > 0
                      ? councilModelsCount // Chairman is included in members, so just show member count
                      : councilModelsCount;
                  return totalModels > 0 ? `Models: ${totalModels}` : "0";
                })()}
              </Text>
            </View>

            {/* Send Button */}
            <TouchableOpacity
              onPress={handleSend}
              disabled={
                (!message.trim() && totalAttachments === 0) ||
                effectivelyDisabled
              }
              className={`w-12 h-12 items-center justify-center rounded-full ${
                (message.trim() || totalAttachments > 0) && !effectivelyDisabled
                  ? "bg-primary"
                  : "bg-muted"
              }`}
            >
              {disabled ? (
                <ActivityIndicator size="small" color="#0f1419" />
              ) : !isOnline ? (
                <WifiOff size={20} color="#ef4444" />
              ) : (
                <Send size={20} color="#0f1419" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Attachment Modal */}
      <AttachmentModal
        visible={showAttachmentModal}
        onClose={() => setShowAttachmentModal(false)}
        onSelectImage={handleImagePick}
        onSelectFile={handleFilePick}
      />
    </Animated.View>
  );
}
