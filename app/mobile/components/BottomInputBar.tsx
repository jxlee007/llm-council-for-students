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
  StyleSheet,
  Pressable,
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
  const [inputHeight, setInputHeight] = useState(44);

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
      setInputHeight(44); // Reset height on send
      setIsFocused(false); // Clear focus state
    }
  };

  const handleKeyPress = (e: any) => {
    if (Platform.OS === "web") {
      if (e.nativeEvent.key === "Enter" && !e.nativeEvent.shiftKey) {
        e.preventDefault();
        handleSend();
      }
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

  // ── Web file-picker (hidden <input type="file">) ──────────────────────────
  const webFileInputRef = useRef<any>(null);

  const handleWebFilePick = () => {
    if (Platform.OS !== "web") return;
    webFileInputRef.current?.click();
  };

  const handleWebFileChange = (e: any) => {
    const file: File | undefined = e.target.files?.[0];
    if (!file) return;

    // Reset so the same file can be picked again
    e.target.value = "";

    if (totalAttachments >= MAX_ATTACHMENTS) {
      Alert.alert("Attachment Limit", `You can attach up to ${MAX_ATTACHMENTS} files or images.`);
      return;
    }

    const isImage = file.type.startsWith("image/");

    const reader = new (globalThis as any).FileReader();
    reader.onload = (ev: any) => {
      const result: string = ev.target.result;

      if (isImage) {
        // Strip the data:<mime>;base64, prefix to get raw base64
        const base64 = result.split(",")[1] || "";
        setImages((prev) => [
          ...prev,
          { name: file.name, type: file.type, uri: result, base64 } as ExtractedImage,
        ]);
      } else {
        setAttachments((prev) => [
          ...prev,
          { name: file.name, type: file.type, text: result } as ExtractedFile,
        ]);
      }
    };

    if (isImage) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };
  // ─────────────────────────────────────────────────────────────────────────

  const showTextInput = isFocused || message.length > 0;

  return (
    <Animated.View
      style={[
        styles.animatedOuter,
        { transform: [{ translateY: Animated.multiply(keyboardOffset, -1) }] }
      ]}
    >
      <View
        style={[
          styles.outerContainer,
          { paddingBottom: Math.max(insets.bottom, 16) }
        ]}
      >
        {/* Attachments Row */}
        {totalAttachments > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.attachmentsScroll}
            contentContainerStyle={styles.attachmentsContent}
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
          style={[
            styles.inputBoxContainer,
            isFocused && styles.inputBoxContainerFocused,
          ]}
        >
          {/* Dynamic Expanding Text Input (above options) */}
          {showTextInput && (
            <TextInput
              ref={inputRef}
              style={[
                styles.textInput,
                {
                  height: Platform.OS === "web" ? Math.min(220, inputHeight) : undefined,
                  maxHeight: 220,
                }
              ]}
              placeholder={
                isOnline ? "Ask anything..." : "Offline - Connect to send"
              }
              placeholderTextColor={isOnline ? "#666666" : "#ef4444"}
              value={message}
              onChangeText={(text) => {
                setMessage(text);
                if (Platform.OS === "web") {
                  requestAnimationFrame(() => {
                    if (inputRef.current) {
                      const el = inputRef.current as any;
                      el.style.height = "auto";
                      const nextHeight = el.scrollHeight;
                      setInputHeight(nextHeight < 44 ? 44 : nextHeight);
                    }
                  });
                }
              }}
              multiline={true}
              blurOnSubmit={false}
              onFocus={handleFocus}
              onBlur={handleBlur}
              maxLength={MAX_CHARS}
              editable={!effectivelyDisabled}
              onKeyPress={handleKeyPress}
              onContentSizeChange={(e) => {
                const nativeHeight = e.nativeEvent.contentSize.height;
                setInputHeight(nativeHeight < 44 ? 44 : nativeHeight);
              }}
            />
          )}

          {/* Options Row */}
          <View style={styles.optionsRow}>
            {/* File Upload Icon — web uses hidden <input>, mobile opens modal */}
            <TouchableOpacity
              onPress={() => {
                if (Platform.OS === "web") {
                  handleWebFilePick();
                } else {
                  setShowAttachmentModal(true);
                }
              }}
              style={styles.iconButton}
              disabled={effectivelyDisabled}
              activeOpacity={0.7}
            >
              <Plus size={18} color="#9ca3af" />
            </TouchableOpacity>

            {/* Collapsed Placeholder (shown only when text input is hidden) */}
            {!showTextInput && (
              <Pressable
                onPress={() => {
                  if (!effectivelyDisabled) {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setIsFocused(true);
                    setTimeout(() => {
                      inputRef.current?.focus();
                    }, 50);
                  }
                }}
                style={styles.placeholderPressable}
              >
                <Text style={styles.placeholderText}>
                  {isOnline ? "Ask anything..." : "Offline - Connect to send"}
                </Text>
              </Pressable>
            )}

            {/* Right Controls (Preset Selector & Send Button) */}
            <View style={styles.rightControls}>
              {/* Character Count Indicator inside right controls */}
              {isFocused && message.length > 0 && (
                <Text style={styles.innerCharCountText}>
                  {message.length}/{MAX_CHARS}
                </Text>
              )}

              <TouchableOpacity
                onPress={onSearchPress}
                style={styles.presetButton}
                disabled={effectivelyDisabled}
                activeOpacity={0.7}
              >
                <Text style={styles.presetButtonText}>
                  {activePresetId && PRESETS[activePresetId]
                    ? PRESETS[activePresetId].label.split(" ")[0] // Compact label
                    : "Custom"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSend}
                disabled={
                  (!message.trim() && totalAttachments === 0) ||
                  effectivelyDisabled
                }
                style={[
                  styles.sendButton,
                  (message.trim() || totalAttachments > 0) && !effectivelyDisabled
                    ? styles.sendButtonActive
                    : styles.sendButtonDisabled,
                ]}
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
          </View>
        </View>
      </View>

      {/* Attachment Modal — native only (web uses hidden <input> above) */}
      {Platform.OS !== "web" && (
        <AttachmentModal
          visible={showAttachmentModal}
          onClose={() => setShowAttachmentModal(false)}
          onSelectImage={handleImagePick}
          onSelectCamera={handleCameraCapture}
          onSelectFile={handleFilePick}
        />
      )}

      {/* Web-only: hidden file input rendered as raw DOM element */}
      {Platform.OS === "web" && (
        // @ts-ignore — web-only JSX element
        <input
          ref={webFileInputRef}
          type="file"
          accept="image/*,.pdf,.txt,.doc,.docx,.csv,.md"
          style={{ display: "none" }}
          onChange={handleWebFileChange}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animatedOuter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  outerContainer: {
    width: "100%",
    maxWidth: 768,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#0f1419",
    marginBottom: Platform.OS === "web" ? 16 : 32,
  },
  attachmentsScroll: {
    marginBottom: 8,
  },
  attachmentsContent: {
    gap: 8,
  },
  inputBoxContainer: {
    flexDirection: "column",
    backgroundColor: "#262626", // Deep dark theme matte
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#404040",
    padding: 8,
  },
  inputBoxContainerFocused: {
    borderColor: "rgba(32, 201, 151, 0.6)",
  },
  textInput: {
    width: "100%",
    color: "#ffffff",
    fontSize: 15,
    lineHeight: 20,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    ...Platform.select({
      web: {
        outlineStyle: "none",
        resize: "none",
      } as any,
      default: {},
    }),
  },
  optionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  placeholderPressable: {
    flex: 1,
    height: 36,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  placeholderText: {
    color: "#666666",
    fontSize: 15,
  },
  rightControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  presetButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(32, 201, 151, 0.1)",
    marginRight: 6,
    alignItems: "center",
    justifyContent: "center",
    height: 36,
  },
  presetButtonText: {
    color: "#20c997",
    fontSize: 12,
    fontWeight: "600",
  },
  sendButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  sendButtonActive: {
    backgroundColor: "#20c997",
  },
  sendButtonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  innerCharCountText: {
    fontSize: 11,
    color: "#6b7280",
    marginRight: 10,
  },
});
