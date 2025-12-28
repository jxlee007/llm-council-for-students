import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, Switch } from "react-native";
import { useStore } from "../../lib/store";

/**
 * Settings screen for app configuration.
 * Includes BYOK API key management and other preferences.
 */
export default function SettingsScreen() {
    const { hasApiKey, saveApiKey, clearApiKey } = useStore();
    const [apiKey, setApiKey] = useState("");
    const [showApiKey, setShowApiKey] = useState(false);

    const handleSaveApiKey = async () => {
        if (!apiKey.trim()) {
            Alert.alert("Error", "Please enter a valid API key");
            return;
        }

        await saveApiKey(apiKey.trim());
        setApiKey("");
        Alert.alert("Success", "API key saved securely!");
    };

    const handleClearApiKey = () => {
        Alert.alert(
            "Remove API Key",
            "Are you sure you want to remove your API key?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: async () => {
                        await clearApiKey();
                        Alert.alert("Success", "API key removed");
                    },
                },
            ]
        );
    };

    return (
        <View className="flex-1 bg-gray-50">
            {/* BYOK Section */}
            <View className="mt-6 mx-4">
                <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    API Configuration
                </Text>
                <View className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <View className="p-4 border-b border-gray-100">
                        <Text className="text-base font-semibold text-gray-900">
                            OpenRouter API Key
                        </Text>
                        <Text className="text-sm text-gray-500 mt-1">
                            Bring your own key for unlimited free usage
                        </Text>
                    </View>

                    {hasApiKey ? (
                        <View className="p-4">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center">
                                    <Text className="text-2xl mr-2">✓</Text>
                                    <Text className="text-green-600 font-medium">API Key configured</Text>
                                </View>
                                <TouchableOpacity
                                    onPress={handleClearApiKey}
                                    className="px-3 py-1 bg-red-100 rounded-lg"
                                >
                                    <Text className="text-red-600 text-sm font-medium">Remove</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View className="p-4">
                            <View className="flex-row items-center mb-3">
                                <TextInput
                                    className="flex-1 bg-gray-100 rounded-lg px-4 py-3 text-base"
                                    placeholder="sk-or-..."
                                    value={apiKey}
                                    onChangeText={setApiKey}
                                    secureTextEntry={!showApiKey}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>
                            <View className="flex-row items-center justify-between mb-4">
                                <Text className="text-sm text-gray-600">Show API key</Text>
                                <Switch
                                    value={showApiKey}
                                    onValueChange={setShowApiKey}
                                    trackColor={{ false: "#d1d5db", true: "#818cf8" }}
                                    thumbColor={showApiKey ? "#4f46e5" : "#f9fafb"}
                                />
                            </View>
                            <TouchableOpacity
                                onPress={handleSaveApiKey}
                                className="bg-primary-600 rounded-lg py-3 items-center"
                            >
                                <Text className="text-white font-semibold">Save API Key</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>

            {/* About Section */}
            <View className="mt-6 mx-4">
                <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    About
                </Text>
                <View className="bg-white rounded-xl border border-gray-100 p-4">
                    <Text className="text-base font-semibold text-gray-900">LLM Council</Text>
                    <Text className="text-sm text-gray-500 mt-1">
                        Get answers from a council of AI models that work together to provide
                        the best response to your questions.
                    </Text>
                    <View className="mt-4 pt-4 border-t border-gray-100">
                        <Text className="text-xs text-gray-400">Version 1.0.0</Text>
                    </View>
                </View>
            </View>

            {/* Info Banner */}
            <View className="mx-4 mt-6 bg-blue-50 rounded-xl p-4 border border-blue-100">
                <Text className="text-sm text-blue-800">
                    💡 <Text className="font-semibold">Tip:</Text> Add your OpenRouter API key
                    to use premium models and get unlimited queries!
                </Text>
            </View>
        </View>
    );
}
