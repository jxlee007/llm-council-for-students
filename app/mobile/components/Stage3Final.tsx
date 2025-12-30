import { View, Text, ScrollView, Dimensions, Platform } from "react-native";
import { Crown } from "lucide-react-native";
import Markdown from "react-native-markdown-display";
import type { Stage3Response } from "../lib/types";

interface Stage3FinalProps {
    response: Stage3Response;
}

/**
 * Chairman's final answer card.
 * Green gradient background with prominent styling.
 * Fixed scrolling with responsive height.
 * Styled for Dark Mode + proper nested scrolling.
 */
export default function Stage3Final({ response }: Stage3FinalProps) {
    if (!response) {
        return null;
    }

    // Extract model short name from full identifier
    const getModelShortName = (model: string): string => {
        const parts = model.split("/");
        const modelName = parts[parts.length - 1];
        return modelName
            .replace(/-/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())
            .replace(":free", "")
            .trim();
    };

    // Responsive height calculation - 45% of screen height, min 350px, max 500px
    const screenHeight = Dimensions.get("window").height;
    const contentHeight = Math.max(350, Math.min(screenHeight * 0.45, 500));

    return (
        <View className="w-full rounded-3xl border border-emerald-900/50 shadow-2xl shadow-emerald-900/25 bg-gradient-to-b from-emerald-950/40 to-emerald-950/20 overflow-hidden">
            {/* Header - Enhanced with gradient */}
            <View className="flex-row items-center px-6 py-4 bg-gradient-to-r from-emerald-900/70 to-emerald-800/60 border-b border-emerald-900/50">
                <View className="w-10 h-10 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400/50 items-center justify-center mr-4 shadow-lg shadow-emerald-500/30">
                    <Crown size={22} color="#d1fae5" strokeWidth={2} />
                </View>
                <View className="flex-1 min-w-0">
                    <Text className="text-emerald-100 font-bold text-lg tracking-tight leading-tight">
                        Chairman's Final Answer
                    </Text>
                    <View className="flex-row items-center gap-2 mt-1">
                        <View className="px-2 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full">
                            <Text className="text-emerald-300 text-xs font-semibold">
                                {getModelShortName(response.model)}
                            </Text>
                        </View>
                        <Text className="text-emerald-400/90 text-xs font-medium">
                            Synthesized by council consensus
                        </Text>
                    </View>
                </View>
            </View>

            {/* Content - Fixed height ScrollView */}
            <View 
                className="border-t border-emerald-900/30"
                style={{ 
                    height: contentHeight,
                    flexShrink: 0
                }}
            >
                <ScrollView 
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                    scrollEnabled={true}
                    bounces={Platform.OS === "ios"}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ 
                        padding: 24,
                        paddingBottom: 16,
                        flexGrow: 1
                    }}
                    scrollEventThrottle={16}
                >
                    <Markdown
                        style={{
                            body: { 
                                color: "#ecfdf5", 
                                fontSize: 15, 
                                lineHeight: 24,
                                marginBottom: 0
                            },
                            code_inline: { 
                                backgroundColor: "#064e3b", 
                                paddingHorizontal: 10, 
                                paddingVertical: 4,
                                borderRadius: 8, 
                                color: "#6ee7b7",
                                fontSize: 14,
                                fontFamily: "monospace"
                            },
                            code_block: { 
                                backgroundColor: "#064e3b", 
                                padding: 20, 
                                borderRadius: 12, 
                                color: "#6ee7b7",
                                fontSize: 14,
                                fontFamily: "monospace",
                                marginVertical: 16,
                                borderWidth: 1,
                                borderColor: "#10b981"
                            },
                            heading1: { 
                                fontSize: 22, 
                                fontWeight: "800", 
                                marginBottom: 16, 
                                marginTop: 0,
                                color: "#d1fae5",
                                letterSpacing: -0.5
                            },
                            heading2: { 
                                fontSize: 19, 
                                fontWeight: "700", 
                                marginBottom: 14, 
                                marginTop: 20,
                                color: "#d1fae5" 
                            },
                            heading3: { 
                                fontSize: 17, 
                                fontWeight: "600", 
                                marginBottom: 12, 
                                marginTop: 16,
                                color: "#d1fae5" 
                            },
                            heading4: { 
                                fontSize: 15, 
                                fontWeight: "600", 
                                marginBottom: 10, 
                                marginTop: 14,
                                color: "#bef264" 
                            },
                            paragraph: { 
                                marginBottom: 16, 
                                color: "#d1fae5",
                                fontSize: 15
                            },
                            bullet_list: { 
                                marginVertical: 12,
                                marginLeft: 20
                            },
                            ordered_list: { 
                                marginVertical: 12,
                                marginLeft: 20
                            },
                            list_item: { 
                                marginBottom: 8,
                                paddingVertical: 2
                            },
                            strong: {
                                fontWeight: "800",
                                color: "#34d399"
                            },
                            em: {
                                fontStyle: "italic",
                                color: "#a7f3d0"
                            },
                            blockquote: {
                                backgroundColor: "#064e3b",
                                borderLeftWidth: 4,
                                borderLeftColor: "#10b981",
                                paddingLeft: 20,
                                paddingVertical: 16,
                                paddingRight: 16,
                                marginVertical: 20,
                                borderRadius: 8,
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 4
                            },
                            hr: {
                                backgroundColor: "#10b981",
                                height: 1,
                                marginVertical: 24
                            }
                        }}
                    >
                        {response.response}
                    </Markdown>
                </ScrollView>
            </View>

            {/* Footer accent */}
            <View className="h-2 bg-gradient-to-r from-emerald-500/30 to-transparent" />
        </View>
    );
}