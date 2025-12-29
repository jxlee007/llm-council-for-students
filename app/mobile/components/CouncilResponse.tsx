import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ChevronRight, ChevronDown } from "lucide-react-native";
import type { Stage1Response, Stage2Response, Stage3Response, AggregateRanking } from "../lib/types";
import Stage1Tabs from "./Stage1Tabs";
import Stage2Rankings from "./Stage2Rankings";
import Stage3Final from "./Stage3Final";

interface CouncilResponseProps {
    stage1?: Stage1Response[];
    stage2?: Stage2Response[];
    stage3?: Stage3Response;
    aggregateRankings?: AggregateRanking[];
}

/**
 * Container component that orchestrates the 3-stage council visualization.
 * Includes collapsible sections for each stage.
 * Hybrid Behavior: Auto-expands during streaming, auto-collapses when finished.
 */
export default function CouncilResponse({ stage1 = [], stage2 = [], stage3, aggregateRankings }: CouncilResponseProps) {
    // Initial state: Expand if final answer is pending (streaming)
    const [expandedStages, setExpandedStages] = useState({
        stage1: !stage3,
        stage2: !stage3,
    });

    // Auto-collapse when Stage 3 arrives (generation complete)
    useEffect(() => {
        if (stage3) {
            setExpandedStages({
                stage1: false,
                stage2: false,
            });
        }
    }, [!!stage3]);

    const toggleStage = (stage: "stage1" | "stage2") => {
        setExpandedStages((prev) => ({
            ...prev,
            [stage]: !prev[stage],
        }));
    };

    const hasStage1 = stage1 && stage1.length > 0;
    const hasStage2 = stage2 && stage2.length > 0;

    return (
        <View className="space-y-3">
            {/* Stage 1: Individual Responses */}
            {hasStage1 && (
                <View className="bg-card rounded-xl border border-border overflow-hidden mb-2">
                    <TouchableOpacity
                        className="flex-row items-center justify-between px-4 py-3 bg-secondary/50 border-b border-border"
                        onPress={() => toggleStage("stage1")}
                        activeOpacity={0.7}
                    >
                        <View className="flex-row items-center">
                            <View className="w-6 h-6 rounded-full bg-stage1 items-center justify-center mr-2">
                                <Text className="text-white text-xs font-bold">1</Text>
                            </View>
                            <Text className="text-blue-400 font-semibold">Individual Responses</Text>
                        </View>
                        {expandedStages.stage1 ? (
                            <ChevronDown size={20} color="#60a5fa" />
                        ) : (
                            <ChevronRight size={20} color="#60a5fa" />
                        )}
                    </TouchableOpacity>

                    {expandedStages.stage1 ? (
                        <View className="p-3">
                            <Stage1Tabs responses={stage1} />
                        </View>
                    ) : (
                        <View className="px-4 py-2">
                            <Text className="text-sm text-muted-foreground">
                                {stage1.length} models responded • Tap to expand
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {/* Stage 2: Rankings */}
            {hasStage2 && (
                <View className="bg-card rounded-xl border border-border overflow-hidden mb-2">
                    <TouchableOpacity
                        className="flex-row items-center justify-between px-4 py-3 bg-secondary/50 border-b border-border"
                        onPress={() => toggleStage("stage2")}
                        activeOpacity={0.7}
                    >
                        <View className="flex-row items-center">
                            <View className="w-6 h-6 rounded-full bg-stage2 items-center justify-center mr-2">
                                <Text className="text-white text-xs font-bold">2</Text>
                            </View>
                            <Text className="text-amber-400 font-semibold">Peer Rankings</Text>
                        </View>
                        {expandedStages.stage2 ? (
                            <ChevronDown size={20} color="#fbbf24" />
                        ) : (
                            <ChevronRight size={20} color="#fbbf24" />
                        )}
                    </TouchableOpacity>

                    {expandedStages.stage2 ? (
                        <View className="p-3">
                            <Stage2Rankings rankings={stage2} aggregateRankings={aggregateRankings} />
                        </View>
                    ) : (
                        <View className="px-4 py-2">
                            <Text className="text-sm text-muted-foreground">
                                {stage2.length} models ranked • Tap to expand
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {/* Stage 3: Final Answer */}
            {stage3 && (
                <Stage3Final response={stage3} />
            )}
        </View>
    );
}
