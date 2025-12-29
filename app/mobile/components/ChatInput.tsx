import { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { Paperclip, Send } from "lucide-react-native";
import { pickAndExtractText, ExtractedFile } from "../lib/files";
import { FileChip } from "./FileChip";

interface ChatInputProps {
    onSend: (message: string, attachment?: ExtractedFile) => void;
    disabled?: boolean;
}

/**
 * Chat input component with text input, send button, and file attachment support.
 * Extracts text from files (max 50k chars) for council consumption.
 */
export default function ChatInput({ onSend, disabled = false }: ChatInputProps) {
    const [message, setMessage] = useState("");
    const [attachment, setAttachment] = useState<ExtractedFile | null>(null);

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
        <View className="px-4 py-3 bg-white border-t border-gray-200">
            {/* Attachment Chip */}
            {attachment && (
                <View className="mb-2">
                    <FileChip 
                        name={attachment.name} 
                        onRemove={() => setAttachment(null)} 
                    />
                </View>
            )}

            <View className="flex-row items-end">
                {/* File picker button */}
                <TouchableOpacity
                    onPress={handleFilePick}
                    disabled={disabled}
                    className="w-10 h-10 items-center justify-center mr-2"
                    activeOpacity={0.7}
                >
                    <Paperclip size={20} color={disabled ? "#d1d5db" : "#6b7280"} />
                </TouchableOpacity>

                {/* Text input */}
                <View className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 min-h-[44px] max-h-32">
                    <TextInput
                        className="text-base text-gray-900 leading-5"
                        placeholder="Ask the council..."
                        placeholderTextColor="#9ca3af"
                        value={message}
                        onChangeText={setMessage}
                        multiline
                        editable={!disabled}
                        onSubmitEditing={handleSend}
                        returnKeyType="send"
                    />
                </View>

                {/* Send button */}
                <TouchableOpacity
                    onPress={handleSend}
                    disabled={(!message.trim() && !attachment) || disabled}
                    className={`w-10 h-10 ml-2 items-center justify-center rounded-full ${(message.trim() || attachment) && !disabled ? "bg-primary-600" : "bg-gray-300"
                        }`}
                    activeOpacity={0.7}
                >
                    {disabled ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Send size={18} color="#fff" />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

