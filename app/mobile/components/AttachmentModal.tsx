import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Camera, Image, FileText } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface AttachmentModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectImage: () => void;
  onSelectCamera: () => void;
  onSelectFile: () => void;
}

/**
 * Bottom sheet modal for selecting attachment type.
 * Options: Camera, Image (gallery), Text File (txt/csv/json/md/pdf/docx)
 */
export function AttachmentModal({
  visible,
  onClose,
  onSelectImage,
  onSelectCamera,
  onSelectFile,
}: AttachmentModalProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(300);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withTiming(300, {
        duration: 250,
        easing: Easing.in(Easing.cubic),
      });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible && opacity.value === 0) return null;

  return (
    <Modal transparent visible={visible} onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View
            className="absolute inset-0 bg-black/60"
            style={overlayStyle}
          />
        </TouchableWithoutFeedback>

        {/* Bottom Sheet */}
        <Animated.View
          className="bg-card rounded-t-3xl border-t border-border shadow-2xl"
          style={[sheetStyle, { paddingBottom: Math.max(insets.bottom, 16) }]}
        >
          {/* Handle */}
          <View className="items-center pt-3 pb-4">
            <View className="w-12 h-1.5 bg-muted rounded-full" />
          </View>

          {/* Header */}
          <View className="px-6 pb-4">
            <Text className="text-xl font-bold text-foreground">
              Attach Content
            </Text>
            <Text className="text-muted-foreground text-sm mt-1">
              Choose what to attach to your message
            </Text>
          </View>

          {/* Options — 3 columns */}
          <View className="px-6 pb-6 flex-row gap-3">
            {/* Camera Option */}
            <TouchableOpacity
              onPress={() => {
                onSelectCamera();
                onClose();
              }}
              activeOpacity={0.7}
              className="flex-1 items-center p-4 bg-secondary/50 border border-border rounded-2xl"
            >
              <View className="w-14 h-14 rounded-2xl bg-sky-500/20 items-center justify-center mb-3">
                <Camera size={28} color="#0ea5e9" />
              </View>
              <Text className="text-sm font-semibold text-foreground mb-1">
                Camera
              </Text>
              <Text className="text-xs text-muted-foreground text-center">
                Take a photo
              </Text>
            </TouchableOpacity>

            {/* Image Gallery Option */}
            <TouchableOpacity
              onPress={() => {
                onSelectImage();
                onClose();
              }}
              activeOpacity={0.7}
              className="flex-1 items-center p-4 bg-secondary/50 border border-border rounded-2xl"
            >
              <View className="w-14 h-14 rounded-2xl bg-emerald-500/20 items-center justify-center mb-3">
                <Image size={28} color="#10b981" />
              </View>
              <Text className="text-sm font-semibold text-foreground mb-1">
                Gallery
              </Text>
              <Text className="text-xs text-muted-foreground text-center">
                JPG, PNG, WebP
              </Text>
            </TouchableOpacity>

            {/* File Option */}
            <TouchableOpacity
              onPress={() => {
                onSelectFile();
                onClose();
              }}
              activeOpacity={0.7}
              className="flex-1 items-center p-4 bg-secondary/50 border border-border rounded-2xl"
            >
              <View className="w-14 h-14 rounded-2xl bg-indigo-500/20 items-center justify-center mb-3">
                <FileText size={28} color="#6366f1" />
              </View>
              <Text className="text-sm font-semibold text-foreground mb-1">
                File
              </Text>
              <Text className="text-xs text-muted-foreground text-center">
                TXT, CSV, MD{"\n"}PDF, DOCX
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
