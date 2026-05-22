import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, LayoutChangeEvent } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { Brain, GitCompare, FileCheck } from "lucide-react-native";

export type StageState = "done" | "active" | "pending";

export interface StageFlowStageConfig {
  label: string;
  activeColor: string;
}

export const STAGE_CONFIGS: StageFlowStageConfig[] = [
  { label: "Reason", activeColor: "#60a5fa" },
  { label: "Compare", activeColor: "#fbbf24" },
  { label: "Result", activeColor: "#34d399" },
];

interface StageFlowIndicatorProps {
  /** Numerically which stage is processing (0 = none started) */
  activeStage: 0 | 1 | 2 | 3 | "vision";
  /** Which pill is "selected" (tapped by user to show content) */
  selectedStage: 1 | 2 | 3 | null;
  /** Called when user taps a pill */
  onSelectStage: (stage: 1 | 2 | 3) => void;
  stage1Count?: number;
  stage1Total?: number;
}



export default function StageFlowIndicator({
  activeStage,
  selectedStage,
  onSelectStage,
  stage1Count = 0,
  stage1Total = 4,
}: StageFlowIndicatorProps) {
  const [widths, setWidths] = useState<number[]>([0, 0, 0]);
  const [xs, setXs] = useState<number[]>([0, 0, 0]);

  const getProcessingState = (stageIndex: number): StageState => {
    const stageNum = stageIndex + 1;
    const active = typeof activeStage === "number" ? activeStage : 1;
    if (active === 0) return "pending";
    if (active > stageNum) return "done";
    if (active === stageNum) return "active";
    return "pending";
  };

  const handleLayout = (index: number) => (event: LayoutChangeEvent) => {
    const { width, x } = event.nativeEvent.layout;
    
    setWidths((prev) => {
      const next = [...prev];
      next[index] = width;
      return next;
    });

    setXs((prev) => {
      const next = [...prev];
      next[index] = x;
      return next;
    });
  };

  const activeIndex = selectedStage ? selectedStage - 1 : 0;

  const animatedPillStyle = useAnimatedStyle(() => {
    const targetWidth = widths[activeIndex] || 0;
    const targetX = xs[activeIndex] || 0;

    let bgColor = "rgba(96, 165, 250, 0.16)";
    let borderColor = "rgba(96, 165, 250, 0.4)";

    if (activeIndex === 1) {
      bgColor = "rgba(251, 191, 36, 0.16)";
      borderColor = "rgba(251, 191, 36, 0.4)";
    } else if (activeIndex === 2) {
      bgColor = "rgba(52, 211, 153, 0.16)";
      borderColor = "rgba(52, 211, 153, 0.4)";
    }

    return {
      width: withTiming(targetWidth, { duration: 220, easing: Easing.out(Easing.quad) }),
      transform: [
        { translateX: withTiming(targetX, { duration: 220, easing: Easing.out(Easing.quad) }) }
      ],
      backgroundColor: withTiming(bgColor, { duration: 220 }),
      borderColor: withTiming(borderColor, { duration: 220 }),
    };
  }, [widths, xs, activeIndex]);

  return (
    <View style={{ paddingVertical: 12, paddingHorizontal: 4 }}>
      <View
        style={{
          flexDirection: "row",
          backgroundColor: "#181d24", // Premium dark charcoal segmented control background
          borderRadius: 24,
          padding: 4,
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.05)",
          position: "relative",
        }}
      >
        {/* Hardware-Accelerated Sliding Capsule Pill */}
        {widths[activeIndex] !== undefined && widths[activeIndex] > 0 && (
          <Animated.View
            style={[
              {
                position: "absolute",
                top: 2,
                bottom: 2,
                borderRadius: 22,
                borderWidth: 1,
              },
              animatedPillStyle,
            ]}
          />
        )}

        {STAGE_CONFIGS.map((cfg, i) => {
          const processingState = getProcessingState(i);
          const isSelected = selectedStage === i + 1;
          const isPending = processingState === "pending";
          const isActive = processingState === "active";
          const isDone = processingState === "done";

          const opacity = isSelected ? 1 : isPending ? 0.25 : 0.65;
          const iconColor = isSelected ? cfg.activeColor : isPending ? "#475569" : "#94a3b8";
          const textColor = isSelected ? "#ffffff" : isPending ? "#475569" : "#94a3b8";

          // Icon mapper
          let IconComponent = Brain;
          if (i === 1) IconComponent = GitCompare;
          if (i === 2) IconComponent = FileCheck;

          // Stage counter injection for Stage 1 (Reason)
          let labelText = cfg.label;
          if (i === 0 && stage1Count !== undefined && stage1Total !== undefined) {
            labelText = `${cfg.label} (${stage1Count}/${stage1Total})`;
          }

          return (
            <TouchableOpacity
              key={i}
              onLayout={handleLayout(i)}
              onPress={() => !isPending && onSelectStage((i + 1) as 1 | 2 | 3)}
              disabled={isPending}
              activeOpacity={0.7}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 10,
                borderRadius: 20,
              }}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", opacity }}>
                <IconComponent size={15} color={iconColor} />
                <Text
                  style={{
                    color: textColor,
                    fontSize: 12,
                    fontWeight: "600",
                    marginLeft: 6,
                  }}
                >
                  {labelText}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
