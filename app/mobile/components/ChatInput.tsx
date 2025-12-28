import { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { Paperclip, Send } from "lucide-react-native";

interface ChatInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
}

/**
 * Chat input component with text input and send button.
 * Includes image picker button for future use.
 */
export default function ChatInput({ onSend, disabled = false }: ChatInputProps) {
    const [message, setMessage] = useState("");

    const handleSend = () => {
        const trimmed = message.trim();
        if (trimmed && !disabled) {
            onSend(trimmed);
            setMessage("");
        }
    };

    const handleImagePick = () => {
        // TODO: Implement image picker with expo-image-picker
        console.log("Image picker - coming soon!");
    };

    return (
        <View className="px-4 py-3 bg-white border-t border-gray-200">
            <View className="flex-row items-end">
                {/* Image picker button */}
                <TouchableOpacity
                    onPress={handleImagePick}
                    className="w-10 h-10 items-center justify-center mr-2"
                    activeOpacity={0.7}
                >
                    <Paperclip size={20} color="#6b7280" />
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
                    disabled={!message.trim() || disabled}
                    className={`w-10 h-10 ml-2 items-center justify-center rounded-full ${message.trim() && !disabled ? "bg-primary-600" : "bg-gray-300"
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
