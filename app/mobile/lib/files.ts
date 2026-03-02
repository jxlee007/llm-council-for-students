import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
// Modern Expo SDK 54 FileSystem API - uses File object (Web standard Blob interface)
import { File } from "expo-file-system";
import { Alert } from "react-native";
import { Config } from "./config";

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

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit for local text extraction
const MAX_TEXT_CHARS = 50000;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB limit for images
const MAX_BACKEND_FILE_SIZE = 10 * 1024 * 1024; // 10MB for backend extraction

/** MIME types that can be read locally as plain UTF-8 text */
const LOCAL_TEXT_MIMES = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "text/html",
  "text/xml",
  "application/json",
  "application/javascript",
]);

/** File extensions that can be read locally */
const LOCAL_TEXT_EXTS = new Set([
  "txt", "md", "csv", "json", "js", "ts", "py", "html", "xml",
]);

/** Extensions that need server-side extraction */
const BACKEND_EXTS = new Set(["pdf", "docx", "doc"]);

/**
 * Get file extension from filename, lowercase.
 */
function getExt(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

/**
 * Whether this file can be read locally (plain text formats).
 */
function isLocalTextFile(filename: string, mimeType?: string): boolean {
  const ext = getExt(filename);
  if (LOCAL_TEXT_EXTS.has(ext)) return true;
  if (mimeType && LOCAL_TEXT_MIMES.has(mimeType.split(";")[0].trim())) return true;
  return false;
}

/**
 * Whether this file needs server-side extraction (docx, pdf).
 */
function needsBackendExtraction(filename: string, mimeType?: string): boolean {
  const ext = getExt(filename);
  if (BACKEND_EXTS.has(ext)) return true;
  if (mimeType === "application/pdf") return true;
  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return true;
  return false;
}

/**
 * Extract text from a file that needs server-side processing (PDF, DOCX).
 * Sends file to /api/files/extract and returns the extracted text.
 */
async function extractViaBackend(uri: string, filename: string, mimeType: string): Promise<string | null> {
  try {
    const formData = new FormData();
    // React Native FormData accepts { uri, name, type } as a Blob-like object
    formData.append("file", {
      uri,
      name: filename,
      type: mimeType,
    } as any);

    const apiUrl = Config.apiUrl;
    const response = await fetch(`${apiUrl}/api/files/extract`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[files] Backend extract error:", errText);
      Alert.alert("Extraction Failed", `Could not extract text from this file (${response.status}).`);
      return null;
    }

    const data = await response.json();
    const text: string = data.text || "";
    if (data.truncated) {
      console.warn("[files] File was truncated to", data.char_count, "characters");
    }
    return text;
  } catch (error) {
    console.error("[files] extractViaBackend error:", error);
    Alert.alert("Error", "Failed to send file to server for extraction.");
    return null;
  }
}

/**
 * Utility to pick a document (txt, csv, json, md, pdf, docx) and extract its text.
 *
 * - Plain text formats (.txt, .csv, .json, .md etc.) are read locally.
 * - Binary formats (.pdf, .docx) are sent to /api/files/extract on the backend.
 *
 * Migration Notes (SDK 54):
 * - OLD: FileSystem.readAsStringAsync(uri) - functional API
 * - NEW: new File(uri).text() - object-oriented API, follows Web Blob interface
 */
export async function pickAndExtractDocument(): Promise<ExtractedFile | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        "text/*",
        "application/json",
        "application/javascript",
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
      ],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const file = result.assets[0];
    const mimeType = file.mimeType || "text/plain";

    if (isLocalTextFile(file.name, mimeType)) {
      // ── Local read path ──────────────────────────────────────────────────
      if (file.size && file.size > MAX_FILE_SIZE) {
        Alert.alert("File too large", "Maximum file size for text extraction is 5MB.");
        return null;
      }
      const fileHandle = new File(file.uri);
      const content = await fileHandle.text();
      const truncatedContent =
        content.length > MAX_TEXT_CHARS ? content.slice(0, MAX_TEXT_CHARS) : content;

      return {
        name: file.name,
        type: mimeType,
        text: truncatedContent,
        uri: file.uri,
      };
    }

    if (needsBackendExtraction(file.name, mimeType)) {
      // ── Backend extraction path ──────────────────────────────────────────
      if (file.size && file.size > MAX_BACKEND_FILE_SIZE) {
        Alert.alert("File too large", "Maximum file size for PDF/DOCX extraction is 10MB.");
        return null;
      }
      const text = await extractViaBackend(file.uri, file.name, mimeType);
      if (text === null) return null;
      const truncatedText = text.length > MAX_TEXT_CHARS ? text.slice(0, MAX_TEXT_CHARS) : text;
      return {
        name: file.name,
        type: mimeType,
        text: truncatedText,
        uri: file.uri,
      };
    }

    // Unsupported format – attempt local UTF-8 read as fallback
    try {
      const fileHandle = new File(file.uri);
      const content = await fileHandle.text();
      return {
        name: file.name,
        type: mimeType,
        text: content.length > MAX_TEXT_CHARS ? content.slice(0, MAX_TEXT_CHARS) : content,
        uri: file.uri,
      };
    } catch {
      Alert.alert(
        "Unsupported Format",
        "This file type is not supported. Please use TXT, CSV, JSON, MD, PDF, or DOCX."
      );
      return null;
    }
  } catch (error) {
    console.error("File pick error:", error);
    Alert.alert("Error", "Failed to read the selected file.");
    return null;
  }
}

/**
 * @deprecated Use pickAndExtractDocument() instead.
 * Kept for backwards compatibility.
 */
export async function pickAndExtractText(): Promise<ExtractedFile | null> {
  return pickAndExtractDocument();
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

    const result =
      source === "camera"
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
