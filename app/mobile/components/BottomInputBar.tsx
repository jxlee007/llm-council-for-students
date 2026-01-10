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
} from "react-native";
import { Plus, Search, Send } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { pickAndExtractText, ExtractedFile } from "../lib/files";
import { FileChip } from "./FileChip";

interface BottomInputBarProps {
  onSend: (message: string, attachment?: ExtractedFile) => void;
  disabled?: boolean;
  showCouncilBadge?: boolean;
  councilModelsCount?: number;
}

/**
 * Unified keyboard-aware input bar using Animated translateY.
 * Listens to keyboard events and animates position.
 */
export default function BottomInputBar({
  onSend,
  disabled = false,
  showCouncilBadge = false,
  councilModelsCount = 0,
}: BottomInputBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<ExtractedFile | null>(null);

  // Animated value for keyboard offset
  const keyboardOffset = useRef(new Animated.Value(0)).current;

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
    if ((trimmed || attachment) && !disabled) {
      onSend(trimmed, attachment || undefined);
      setMessage("");
      setAttachment(null);
    }
  };

  const handleFilePick = async () => {
    const file = await pickAndExtractText();
    if (file) {
      setAttachment(file);
    }
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
        {/* Attachment Chip */}
        {attachment && (
          <View className="mb-2">
            <FileChip
              name={attachment.name}
              onRemove={() => setAttachment(null)}
            />
          </View>
        )}

        <View className="bg-card rounded-2xl border border-border overflow-hidden">
          {/* Text Input */}
          <TextInput
            className="text-base text-foreground px-4 pt-4 pb-2 min-h-[60px] max-h-32"
            placeholder="Ask anything..."
            placeholderTextColor="#6b7280"
            value={message}
            onChangeText={setMessage}
            multiline
            editable={!disabled}
          />

          {/* Action Row */}
          <View className="flex-row items-center justify-between px-3 pb-3">
            {/* Left Icons */}
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={handleFilePick}
                className="w-10 h-10 items-center justify-center rounded-full bg-secondary"
                disabled={disabled}
              >
                <Plus size={18} color="#9ca3af" />
              </TouchableOpacity>
              <TouchableOpacity
                className="w-10 h-10 items-center justify-center rounded-full bg-secondary"
                disabled={disabled}
              >
                <Search size={18} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {/* Send Button */}
            <TouchableOpacity
              onPress={handleSend}
              disabled={(!message.trim() && !attachment) || disabled}
              className={`w-12 h-12 items-center justify-center rounded-full ${
                (message.trim() || attachment) && !disabled
                  ? "bg-primary"
                  : "bg-muted"
              }`}
            >
              {disabled ? (
                <ActivityIndicator size="small" color="#0f1419" />
              ) : (
                <Send size={20} color="#0f1419" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Council Config Badge (Home screen only) */}
        {showCouncilBadge && (
          <View className="flex-row items-center justify-center mt-3 gap-2">
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/configure")}
              className="bg-primary/20 px-3 py-1.5 rounded-full"
            >
              <Text className="text-primary text-xs font-medium">
                Council Config
              </Text>
            </TouchableOpacity>
            <Text className="text-muted-foreground text-xs">
              {councilModelsCount > 0
                ? `${councilModelsCount} models selected`
                : "Default models"}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}
