import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import Markdown from "react-native-markdown-display";
import type { Stage1Response } from "../lib/types";

interface Stage1TabsProps {
    responses: Stage1Response[];
}

/**
 * Horizontal ScrollView with tabs showing each model's response.
 * Displays model name labels with active tab indicator.
 */
export default function Stage1Tabs({ responses }: Stage1TabsProps) {
    const [activeIndex, setActiveIndex] = useState(0);

    if (!responses || responses.length === 0) {
        return (
            <View className="p-4 items-center">
                <Text className="text-gray-500">No responses available</Text>
            </View>
        );
    }

    // Extract model short name from full identifier
    const getModelShortName = (model: string) => {
        // e.g., "google/gemini-2.5-flash" -> "Gemini 2.5 Flash"
        const parts = model.split("/");
        const modelName = parts[parts.length - 1];
        return modelName
            .replace(/-/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())
            .replace(":free", "")
            .trim();
    };

    const activeResponse = responses[activeIndex];

    return (
        <View>
            {/* Tab bar */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-3"
                contentContainerStyle={{ paddingHorizontal: 4 }}
            >
                {responses.map((response, index) => (
                    <TouchableOpacity
                        key={response.model}
                        onPress={() => setActiveIndex(index)}
                        className={`px-4 py-2 rounded-full mr-2 ${index === activeIndex
                                ? "bg-stage1"
                                : "bg-gray-100"
                            }`}
                        activeOpacity={0.7}
                    >
                        <Text
                            className={`text-sm font-medium ${index === activeIndex ? "text-white" : "text-gray-600"
                                }`}
                            numberOfLines={1}
                        >
                            {getModelShortName(response.model)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Response content */}
            <View className="bg-gray-50 rounded-lg p-3 max-h-80">
                <ScrollView showsVerticalScrollIndicator={true}>
                    <Markdown
                        style={{
                            body: { color: "#1f2937", fontSize: 14, lineHeight: 20 },
                            code_inline: { backgroundColor: "#e5e7eb", paddingHorizontal: 4, borderRadius: 4 },
                            code_block: { backgroundColor: "#f3f4f6", padding: 8, borderRadius: 4 },
                            heading1: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
                            heading2: { fontSize: 16, fontWeight: "bold", marginBottom: 6 },
                            heading3: { fontSize: 14, fontWeight: "bold", marginBottom: 4 },
                            paragraph: { marginBottom: 8 },
                            bullet_list: { marginLeft: 8 },
                            ordered_list: { marginLeft: 8 },
                        }}
                    >
                        {activeResponse.response}
                    </Markdown>
                </ScrollView>
            </View>

            {/* Model indicator */}
            <View className="mt-2 flex-row items-center justify-between">
                <Text className="text-xs text-gray-400">
                    Model: {activeResponse.model}
                </Text>
                <Text className="text-xs text-gray-400">
                    {activeIndex + 1} of {responses.length}
                </Text>
            </View>
        </View>
    );
}
