import { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import Markdown from "react-native-markdown-display";
import type { Stage1Response } from "../lib/types";

interface Stage1TabsProps {
  responses: Stage1Response[];
}

/**
 * Horizontal ScrollView with tabs showing each model's response.
 * Displays model name labels with active tab indicator.
 * Fixed scrolling with responsive height.
 * Styled for Dark Mode + proper nested scrolling.
 */
export default function Stage1Tabs({ responses }: Stage1TabsProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!responses || responses.length === 0) {
    return (
      <View className="p-4 items-center">
        <Text className="text-muted-foreground">No responses available</Text>
      </View>
    );
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

  const activeResponse = responses[activeIndex];

  return (
    <View className="w-full">
      {/* Tab bar - Horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-4"
        contentContainerStyle={{
          paddingHorizontal: 16,
          gap: 8,
        }}
        bounces
      >
        {responses.map((response, index) => (
          <Pressable
            key={response.model} // ✅ Unique key
            onPress={() => setActiveIndex(index)}
            style={
              index === activeIndex
                ? {
                    elevation: 4,
                    shadowColor: "#20c997",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                  }
                : undefined
            }
            className={`px-6 py-3 rounded-2xl mr-2 min-w-[120px] ${
              index === activeIndex
                ? "bg-primary"
                : "bg-secondary/50 hover:bg-secondary"
            }`}
          >
            <Text
              className={`text-sm font-semibold text-center ${
                index === activeIndex
                  ? "text-primary-foreground"
                  : "text-muted-foreground"
              }`}
              numberOfLines={1}
            >
              {getModelShortName(response.model)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Response content - Natural height expansion */}
      <View className="rounded-xl overflow-hidden px-2 pb-4">
        <Markdown
          style={{
            body: {
              color: "#ffffff",
              fontSize: 14,
              lineHeight: 22,
              marginBottom: 0,
            },
            code_inline: {
              backgroundColor: "#1a1f26",
              paddingHorizontal: 8,
              borderRadius: 6,
              color: "#e5e7eb",
              fontSize: 13,
            },
            code_block: {
              backgroundColor: "#1a1f26",
              padding: 16,
              borderRadius: 8,
              color: "#e5e7eb",
              fontSize: 13,
              marginVertical: 12,
            },
            heading1: {
              fontSize: 20,
              fontWeight: "800",
              marginBottom: 12,
              marginTop: 0,
              color: "#ffffff",
            },
            heading2: {
              fontSize: 17,
              fontWeight: "700",
              marginBottom: 10,
              marginTop: 16,
              color: "#ffffff",
            },
            heading3: {
              fontSize: 15,
              fontWeight: "600",
              marginBottom: 8,
              marginTop: 12,
              color: "#ffffff",
            },
            paragraph: {
              marginBottom: 12,
              color: "#d1d5db",
              fontSize: 14,
            },
            bullet_list: {
              marginLeft: 16,
              marginVertical: 8,
            },
            ordered_list: {
              marginLeft: 16,
              marginVertical: 8,
            },
            strong: {
              fontWeight: "700",
              color: "#f8fafc",
            },
            blockquote: {
              backgroundColor: "#1e293b",
              borderLeftWidth: 4,
              borderLeftColor: "#3b82f6",
              paddingLeft: 16,
              paddingVertical: 12,
              marginVertical: 12,
            },
          }}
        >
          {activeResponse.response}
        </Markdown>
      </View>

      {/* Model indicator */}
      <View className="mt-4 px-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Text className="text-xs font-mono text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md">
            {getModelShortName(activeResponse.model)}
          </Text>
          <Text className="text-xs text-muted-foreground">
            {activeResponse.model}
          </Text>
        </View>
        <Text className="text-xs font-medium text-muted-foreground">
          {activeIndex + 1} / {responses.length}
        </Text>
      </View>
    </View>
  );
}
