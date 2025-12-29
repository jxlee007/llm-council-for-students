import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { Alert } from "react-native";

export interface ExtractedFile {
  name: string;
  type: string;
  text: string;
  uri: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit for extraction
const MAX_TEXT_CHARS = 50000;

/**
 * Utility to pick a file and extract its text content.
 * Supports .txt, .md, .csv, and other text-based formats.
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

    // Read file content
    const content = await FileSystem.readAsStringAsync(file.uri);
    
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
