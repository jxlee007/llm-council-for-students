import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import type { Stage1Response, Stage2Response, Stage3Response } from "../lib/types";
import Stage1Tabs from "./Stage1Tabs";
import Stage2Rankings from "./Stage2Rankings";
import Stage3Final from "./Stage3Final";

interface CouncilResponseProps {
    stage1: Stage1Response[];
    stage2: Stage2Response[];
    stage3: Stage3Response;
}

/**
 * Container component that orchestrates the 3-stage council visualization.
 * Includes collapsible sections for each stage.
 */
export default function CouncilResponse({ stage1, stage2, stage3 }: CouncilResponseProps) {
    const [expandedStages, setExpandedStages] = useState({
        stage1: false,
        stage2: false,
    });

    const toggleStage = (stage: "stage1" | "stage2") => {
        setExpandedStages((prev) => ({
            ...prev,
            [stage]: !prev[stage],
        }));
    };

    return (
        <View className="space-y-3">
            {/* Stage 3: Final Answer (Always shown first and prominently) */}
            <Stage3Final response={stage3} />

            {/* Stage 1: Individual Responses (Collapsible) */}
            <View className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <TouchableOpacity
                    className="flex-row items-center justify-between px-4 py-3 bg-blue-50 border-b border-blue-100"
                    onPress={() => toggleStage("stage1")}
                    activeOpacity={0.7}
                >
                    <View className="flex-row items-center">
                        <View className="w-6 h-6 rounded-full bg-stage1 items-center justify-center mr-2">
                            <Text className="text-white text-xs font-bold">1</Text>
                        </View>
                        <Text className="text-blue-800 font-semibold">Individual Responses</Text>
                    </View>
                    <Text className="text-blue-600">{expandedStages.stage1 ? "▼" : "▶"}</Text>
                </TouchableOpacity>

                {expandedStages.stage1 && (
                    <View className="p-3">
                        <Stage1Tabs responses={stage1} />
                    </View>
                )}

                {!expandedStages.stage1 && (
                    <View className="px-4 py-2">
                        <Text className="text-sm text-gray-500">
                            {stage1.length} models responded • Tap to expand
                        </Text>
                    </View>
                )}
            </View>

            {/* Stage 2: Rankings (Collapsible) */}
            <View className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <TouchableOpacity
                    className="flex-row items-center justify-between px-4 py-3 bg-amber-50 border-b border-amber-100"
                    onPress={() => toggleStage("stage2")}
                    activeOpacity={0.7}
                >
                    <View className="flex-row items-center">
                        <View className="w-6 h-6 rounded-full bg-stage2 items-center justify-center mr-2">
                            <Text className="text-white text-xs font-bold">2</Text>
                        </View>
                        <Text className="text-amber-800 font-semibold">Peer Rankings</Text>
                    </View>
                    <Text className="text-amber-600">{expandedStages.stage2 ? "▼" : "▶"}</Text>
                </TouchableOpacity>

                {expandedStages.stage2 && (
                    <View className="p-3">
                        <Stage2Rankings rankings={stage2} />
                    </View>
                )}

                {!expandedStages.stage2 && (
                    <View className="px-4 py-2">
                        <Text className="text-sm text-gray-500">
                            {stage2.length} models ranked • Tap to expand
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}
