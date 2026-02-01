import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
// Modern Expo SDK 54 FileSystem API - uses File object (Web standard Blob interface)
import { File } from "expo-file-system";
import { Alert } from "react-native";

export interface ExtractedFile {
  name: string;
  type: string;
  text: string;
  uri: string;
}

export interface ExtractedImage {
  name: string;
  type: string;
  uri: string;
  base64?: string;
  width: number;
  height: number;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit for extraction
const MAX_TEXT_CHARS = 50000;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB limit for images

/**
 * Utility to pick a file and extract its text content.
 * Supports .txt, .md, .csv, and other text-based formats.
 * 
 * Migration Notes (SDK 54):
 * - OLD: FileSystem.readAsStringAsync(uri) - functional API
 * - NEW: new File(uri).text() - object-oriented API, follows Web Blob interface
 * - Both read files as UTF-8 text by default, no semantic difference
 * - New API is optimized for Expo's New Architecture
 */
export async function pickAndExtractText(): Promise<ExtractedFile | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["text/*", "application/json", "application/javascript"],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const file = result.assets[0];

    // Check file size
    if (file.size && file.size > MAX_FILE_SIZE) {
      Alert.alert("File too large", "Maximum file size for text extraction is 5MB.");
      return null;
    }

    // Read file content using modern Expo SDK 54 File API
    // Creates a File object and reads as UTF-8 text (follows Web Blob interface)
    const fileHandle = new File(file.uri);
    const content = await fileHandle.text();

    // Truncate if necessary
    const truncatedContent = content.length > MAX_TEXT_CHARS
      ? content.slice(0, MAX_TEXT_CHARS)
      : content;

    return {
      name: file.name,
      type: file.mimeType || "text/plain",
      text: truncatedContent,
      uri: file.uri,
    };

  } catch (error) {
    console.error("File pick error:", error);
    Alert.alert("Error", "Failed to read the selected file.");
    return null;
  }
}

/**
 * Utility to pick an image from gallery or camera.
 * Returns image metadata and base64 data for upload.
 */
export async function pickImage(source: "gallery" | "camera" = "gallery"): Promise<ExtractedImage | null> {
  try {
    // Request permissions
    if (source === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Camera access is required to take photos.");
        return null;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Photo library access is required to select images.");
        return null;
      }
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    };

    const result = source === "camera"
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const image = result.assets[0];

    // Check file size (estimate from base64)
    if (image.base64 && image.base64.length * 0.75 > MAX_IMAGE_SIZE) {
      Alert.alert("Image too large", "Maximum image size is 10MB.");
      return null;
    }

    // Generate filename from URI or timestamp
    const filename = image.fileName || `image_${Date.now()}.jpg`;

    return {
      name: filename,
      type: image.mimeType || "image/jpeg",
      uri: image.uri,
      base64: image.base64 ?? undefined,
      width: image.width,
      height: image.height,
    };

  } catch (error) {
    console.error("Image pick error:", error);
    Alert.alert("Error", "Failed to select image.");
    return null;
  }
}

