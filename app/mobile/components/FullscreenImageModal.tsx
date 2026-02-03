import React from "react";
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Share,
  Alert,
} from "react-native";
import { X, Share as ShareIcon } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface FullscreenImageModalProps {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
}

/**
 * Fullscreen modal to view an image.
 * Supports basic closing and sharing.
 */
export function FullscreenImageModal({
  visible,
  imageUri,
  onClose,
}: FullscreenImageModalProps) {
  const insets = useSafeAreaInsets();

  if (!imageUri) return null;

  const handleShare = async () => {
    if (!imageUri) return;

    try {
      await Share.share({
        url: imageUri, // iOS: supports generic URLs and data URIs
        message: Platform.OS === "android" ? "Shared image" : undefined,
      });
    } catch (error) {
      console.error("Error sharing image:", error);
      Alert.alert("Error", "Failed to share image.");
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <StatusBar hidden={true} />

        {/* Main Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        {/* Controls Overlay */}
        <View style={[styles.controls, { top: insets.top + 10 }]}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.button}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={24} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShare}
            style={styles.button}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ShareIcon size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    width: "100%",
    height: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  controls: {
    position: "absolute",
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
});
