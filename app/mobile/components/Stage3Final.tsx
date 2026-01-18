import { View, Text } from "react-native";
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

  return (
    <View className="w-full bg-transparent">
      {/* Content - Fully expanded view (no nested scroll) */}
      <View
        style={{
          paddingHorizontal: 4,
          paddingBottom: 160, // ample space for bottom input bar overlap
        }}
      >
        <Markdown
          style={{
            body: {
              color: "#ecfdf5", // emerald-50
              fontSize: 16,
              lineHeight: 28, // More breathable
              marginBottom: 0,
            },
            code_inline: {
              backgroundColor: "#064e3b",
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 6,
              color: "#6ee7b7",
              fontSize: 14,
              fontFamily: "monospace",
            },
            code_block: {
              backgroundColor: "#022c22",
              padding: 16,
              borderRadius: 8,
              color: "#6ee7b7",
              fontSize: 14,
              fontFamily: "monospace",
              marginVertical: 12,
            },
            heading1: {
              fontSize: 24,
              fontWeight: "800",
              marginBottom: 16,
              marginTop: 8,
              color: "#d1fae5",
            },
            heading2: {
              fontSize: 20,
              fontWeight: "700",
              marginBottom: 12,
              marginTop: 24,
              color: "#d1fae5",
            },
            heading3: {
              fontSize: 18,
              fontWeight: "600",
              marginBottom: 8,
              marginTop: 16,
              color: "#d1fae5",
            },
            paragraph: {
              marginBottom: 16,
              color: "#d1fae5",
              fontSize: 16,
            },
            bullet_list: {
              marginVertical: 8,
              marginLeft: 8,
            },
            ordered_list: {
              marginVertical: 8,
              marginLeft: 8,
            },
            strong: {
              fontWeight: "800",
              color: "#34d399",
            },
            blockquote: {
              borderLeftWidth: 3,
              borderLeftColor: "#10b981",
              paddingLeft: 16,
              marginVertical: 16,
              opacity: 0.8,
            },
          }}
        >
          {response.response}
        </Markdown>
      </View>
    </View>
  );
}
