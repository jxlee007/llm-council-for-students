import { View, Text, ScrollView } from "react-native";
import { Crown } from "lucide-react-native";
import Markdown from "react-native-markdown-display";
import type { Stage3Response } from "../lib/types";

interface Stage3FinalProps {
    response: Stage3Response;
}

/**
 * Chairman's final answer card.
 * Green gradient background with prominent styling.
 * Styled for Dark Mode.
 */
export default function Stage3Final({ response }: Stage3FinalProps) {
    if (!response) {
        return null;
    }

    // Extract model short name
    const getModelShortName = (model: string) => {
        const parts = model.split("/");
        const modelName = parts[parts.length - 1];
        return modelName
            .replace(/-/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())
            .replace(":free", "")
            .trim();
    };

    return (
        <View className="bg-emerald-950/30 rounded-xl border border-emerald-900 overflow-hidden">
            {/* Header */}
            <View className="flex-row items-center px-4 py-3 bg-emerald-900/50 border-b border-emerald-900">
                <View className="w-8 h-8 rounded-full bg-stage3 items-center justify-center mr-3">
                    <Crown size={18} color="#fff" />
                </View>
                <View className="flex-1">
                    <Text className="text-emerald-100 font-bold text-base">
                        Chairman's Final Answer
                    </Text>
                    <Text className="text-emerald-400 text-xs">
                        Synthesized by {getModelShortName(response.model)}
                    </Text>
                </View>
            </View>

            {/* Content */}
            <ScrollView className="p-4 max-h-96">
                <Markdown
                    style={{
                        body: { color: "#ecfdf5", fontSize: 15, lineHeight: 22 },
                        code_inline: {
                            backgroundColor: "#064e3b",
                            paddingHorizontal: 4,
                            borderRadius: 4,
                            color: "#6ee7b7",
                        },
                        code_block: {
                            backgroundColor: "#064e3b",
                            padding: 12,
                            borderRadius: 8,
                            color: "#6ee7b7",
                        },
                        heading1: {
                            fontSize: 20,
                            fontWeight: "bold",
                            marginBottom: 10,
                            color: "#d1fae5",
                        },
                        heading2: {
                            fontSize: 18,
                            fontWeight: "bold",
                            marginBottom: 8,
                            color: "#d1fae5",
                        },
                        heading3: {
                            fontSize: 16,
                            fontWeight: "bold",
                            marginBottom: 6,
                            color: "#d1fae5",
                        },
                        paragraph: { marginBottom: 10 },
                        bullet_list: { marginLeft: 8 },
                        ordered_list: { marginLeft: 8 },
                        list_item: { marginBottom: 4 },
                        strong: { fontWeight: "bold", color: "#34d399" },
                        em: { fontStyle: "italic" },
                        blockquote: {
                            backgroundColor: "#064e3b",
                            borderLeftWidth: 4,
                            borderLeftColor: "#10b981",
                            paddingLeft: 12,
                            paddingVertical: 8,
                            marginVertical: 8,
                        },
                    }}
                >
                    {response.response}
                </Markdown>
            </ScrollView>
        </View>
    );
}
