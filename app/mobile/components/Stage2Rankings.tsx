import { View, Text, ScrollView } from "react-native";
import { Trophy } from "lucide-react-native";
import type { Stage2Response } from "../lib/types";
import { useUIStore } from "../lib/store";

interface Stage2RankingsProps {
    rankings: Stage2Response[];
}

/**
 * Visual ranking display with aggregate rankings.
 * Shows 1st/2nd/3rd badges with color coding.
 */
export default function Stage2Rankings({ rankings }: Stage2RankingsProps) {
    const { aggregateRankings } = useUIStore();

    // Extract model short name from full identifier
    const getModelShortName = (model: string) => {
        const parts = model.split("/");
        const modelName = parts[parts.length - 1];
        return modelName
            .replace(/-/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())
            .replace(":free", "")
            .trim();
    };

    // Get badge style based on rank
    const getRankStyle = (rank: number) => {
        switch (rank) {
            case 1:
                return {
                    bg: "bg-yellow-100",
                    text: "text-yellow-800",
                    border: "border-yellow-300",
                    emoji: <Trophy size={20} color="#b45309" />,
                };
            case 2:
                return {
                    bg: "bg-gray-100",
                    text: "text-gray-700",
                    border: "border-gray-300",
                    emoji: <Trophy size={20} color="#4b5563" />,
                };
            case 3:
                return {
                    bg: "bg-amber-100",
                    text: "text-amber-800",
                    border: "border-amber-300",
                    emoji: <Trophy size={20} color="#d97706" />,
                };
            default:
                return {
                    bg: "bg-gray-50",
                    text: "text-gray-600",
                    border: "border-gray-200",
                    emoji: <Text className="text-xs font-bold text-gray-400">#{rank}</Text>,
                };
        }
    };

    if (!rankings || rankings.length === 0) {
        return (
            <View className="p-4 items-center">
                <Text className="text-gray-500">No rankings available</Text>
            </View>
        );
    }

    return (
        <View>
            {/* Aggregate Rankings */}
            {aggregateRankings.length > 0 && (
                <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                        Aggregate Rankings
                    </Text>
                    {aggregateRankings.map((ranking, index) => {
                        const style = getRankStyle(index + 1);
                        return (
                            <View
                                key={ranking.model}
                                className={`flex-row items-center p-3 rounded-lg mb-2 border ${style.bg} ${style.border}`}
                            >
                                <View className="mr-3">{style.emoji}</View>
                                <View className="flex-1">
                                    <Text className={`font-medium ${style.text}`}>
                                        {getModelShortName(ranking.model)}
                                    </Text>
                                    <Text className="text-xs text-gray-500">
                                        Avg. rank: {ranking.average_rank.toFixed(2)} ({ranking.rankings_count} votes)
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            )}

            {/* Individual Rankings from each model */}
            <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                    Individual Model Votes
                </Text>
                <ScrollView className="max-h-40">
                    {rankings.map((ranking) => (
                        <View
                            key={ranking.model}
                            className="bg-gray-50 rounded-lg p-3 mb-2"
                        >
                            <Text className="text-sm font-medium text-gray-700 mb-1">
                                {getModelShortName(ranking.model)} ranked:
                            </Text>
                            <View className="flex-row flex-wrap">
                                {ranking.parsed_ranking.map((label, idx) => (
                                    <View
                                        key={label}
                                        className={`px-2 py-1 rounded mr-1 mb-1 ${getRankStyle(idx + 1).bg
                                            }`}
                                    >
                                        <Text className={`text-xs ${getRankStyle(idx + 1).text}`}>
                                            {idx + 1}. {label}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </View>
    );
}
