import React, { useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";

export type StageState = "done" | "active" | "pending";

export interface StageFlowStageConfig {
  label: string;
  sub: string;
  activeColor: string;
}

export const STAGE_CONFIGS: StageFlowStageConfig[] = [
  { label: "REASON",  sub: "Stage 1", activeColor: "#60a5fa" },
  { label: "COMPARE", sub: "Stage 2", activeColor: "#fbbf24" },
  { label: "RESULT",  sub: "Stage 3", activeColor: "#34d399" },
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

/** Animated pulsing dot for in-progress stages */
function PulsingDot({ color }: { color: string }) {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.15, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[
        { width: 6, height: 6, borderRadius: 3, backgroundColor: color, marginLeft: 5 },
        style,
      ]}
    />
  );
}

/** Single stage pill — tappable when stage has data */
function StagePill({
  config,
  processingState,
  isSelected,
  onPress,
  delay = 0,
  stage1Count,
  stage1Total,
  index,
}: {
  config: StageFlowStageConfig;
  processingState: StageState;
  isSelected: boolean;
  onPress: () => void;
  delay?: number;
  stage1Count?: number;
  stage1Total?: number;
  index: number;
}) {
  const opacity = useSharedValue(processingState === "pending" ? 0.35 : 0);
  const scale = useSharedValue(0.88);

  useEffect(() => {
    if (processingState !== "pending") {
      opacity.value = withDelay(delay, withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }));
      scale.value = withDelay(delay, withTiming(1, { duration: 320, easing: Easing.out(Easing.back(1.1)) }));
    } else {
      opacity.value = withTiming(0.35, { duration: 250 });
      scale.value = withTiming(1, { duration: 250 });
    }
  }, [processingState]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const isDone = processingState === "done";
  const isProcessing = processingState === "active";
  const isLit = isDone || isProcessing;

  const borderColor = isSelected
    ? config.activeColor
    : isLit
    ? `${config.activeColor}99`
    : "#2d3748";

  const bgColor = isSelected
    ? `${config.activeColor}28`
    : isLit
    ? `${config.activeColor}10`
    : "#1a2332";

  const subText =
    index === 0 && stage1Count !== undefined && stage1Total !== undefined
      ? `${stage1Count} / ${stage1Total}`
      : config.sub;

  const isTappable = processingState !== "pending";

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={onPress}
        disabled={!isTappable}
        activeOpacity={isTappable ? 0.7 : 1}
        style={{
          width: 92,
          minHeight: 72,
          borderRadius: 16,
          borderWidth: isSelected ? 2 : 1.5,
          borderColor,
          backgroundColor: bgColor,
          paddingVertical: 12,
          paddingHorizontal: 8,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            color: isLit ? config.activeColor : "#4a5568",
            fontSize: 10,
            fontWeight: "700",
            letterSpacing: 1,
            textAlign: "center",
          }}
        >
          {config.label}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 5 }}>
          <Text
            style={{
              color: isLit ? "#94a3b8" : "#2d3748",
              fontSize: 10,
              textAlign: "center",
            }}
          >
            {subText}
          </Text>
          {isProcessing && <PulsingDot color={config.activeColor} />}
        </View>

        {/* Selected underline indicator */}
        {isSelected && (
          <View
            style={{
              position: "absolute",
              bottom: 4,
              width: 20,
              height: 2,
              borderRadius: 1,
              backgroundColor: config.activeColor,
            }}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

/** Arrow connector between pills */
function Arrow({ lit }: { lit: boolean }) {
  const opacity = useSharedValue(0.15);
  useEffect(() => {
    opacity.value = withTiming(lit ? 0.9 : 0.15, { duration: 400 });
  }, [lit]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={[{ marginHorizontal: 4, alignItems: "center", justifyContent: "center" }, style]}>
      <Text style={{ color: "#64748b", fontSize: 18, fontWeight: "200" }}>→</Text>
    </Animated.View>
  );
}

export default function StageFlowIndicator({
  activeStage,
  selectedStage,
  onSelectStage,
  stage1Count = 0,
  stage1Total = 4,
}: StageFlowIndicatorProps) {
  const getProcessingState = (stageIndex: number): StageState => {
    const stageNum = stageIndex + 1;
    const active = typeof activeStage === "number" ? activeStage : 1;
    if (active === 0) return "pending";
    if (active > stageNum) return "done";
    if (active === stageNum) return "active";
    return "pending";
  };

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        paddingHorizontal: 4,
      }}
    >
      {STAGE_CONFIGS.map((cfg, i) => (
        <React.Fragment key={i}>
          <StagePill
            config={cfg}
            processingState={getProcessingState(i)}
            isSelected={selectedStage === i + 1}
            onPress={() => onSelectStage((i + 1) as 1 | 2 | 3)}
            delay={i * 80}
            stage1Count={stage1Count}
            stage1Total={stage1Total}
            index={i}
          />
          {i < STAGE_CONFIGS.length - 1 && (
            <Arrow lit={getProcessingState(i) === "done"} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}
