import { useState, useEffect, useRef } from "react";
import { View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  FadeInDown,
  FadeOutUp,
} from "react-native-reanimated";
import type {
  Stage1Response,
  Stage2Response,
  Stage3Response,
  AggregateRanking,
} from "../lib/types";
import Stage1Tabs from "./Stage1Tabs";
import Stage2Rankings from "./Stage2Rankings";
import Stage3Final from "./Stage3Final";
import StageFlowIndicator from "./StageFlowIndicator";

interface CouncilResponseProps {
  stage1?: Stage1Response[];
  stage2?: Stage2Response[];
  stage3?: Stage3Response;
  aggregateRankings?: AggregateRanking[];
  /** Total expected council members (for stage 1 counter) */
  totalMembers?: number;
}

export default function CouncilResponse({
  stage1 = [],
  stage2 = [],
  stage3,
  aggregateRankings,
  totalMembers = 4,
}: CouncilResponseProps) {
  const hasStage1 = stage1 && stage1.length > 0;
  const hasStage2 = stage2 && stage2.length > 0;
  const hasStage3 = !!stage3;

  // The tab selected by the user (or auto-advance)
  const [selectedStage, setSelectedStage] = useState<1 | 2 | 3 | null>(null);

  const prevStage1Count = useRef(0);
  const hasStage3Arrived = useRef(false);

  // Determine the current "processing" stage number for visual state
  const getActiveStage = (): 0 | 1 | 2 | 3 => {
    if (hasStage3) return 3;
    if (hasStage2) return 2;
    if (hasStage1) return 1;
    return 0;
  };

  // Auto-advance selected tab as stages come in
  useEffect(() => {
    if (!hasStage1 && !hasStage2 && !hasStage3) return;

    // Stage 3 arrives → auto-show stage 3
    if (hasStage3 && !hasStage3Arrived.current) {
      setSelectedStage(3);
      hasStage3Arrived.current = true;
    }

    // Stage 1 first arrives → auto-show stage 1
    if (hasStage1 && prevStage1Count.current === 0 && !hasStage3) {
      setSelectedStage(1);
    }

    prevStage1Count.current = stage1.length;
  }, [stage1.length, stage2.length, hasStage3]);

  const handleSelectStage = (stage: 1 | 2 | 3) => {
    // Only allow selecting a stage that has data
    if (stage === 1 && !hasStage1) return;
    if (stage === 2 && !hasStage2) return;
    if (stage === 3 && !hasStage3) return;
    // Toggle off if already selected
    setSelectedStage((prev) => (prev === stage ? null : stage));
  };

  const renderContent = () => {
    if (selectedStage === 1 && hasStage1) {
      return (
        <Animated.View entering={FadeInDown.duration(220).easing(Easing.out(Easing.cubic))}>
          <Stage1Tabs responses={stage1} />
        </Animated.View>
      );
    }
    if (selectedStage === 2 && hasStage2) {
      return (
        <Animated.View entering={FadeInDown.duration(220).easing(Easing.out(Easing.cubic))}>
          <Stage2Rankings rankings={stage2} aggregateRankings={aggregateRankings} />
        </Animated.View>
      );
    }
    if (selectedStage === 3 && hasStage3) {
      return (
        <Animated.View entering={FadeInDown.duration(220).easing(Easing.out(Easing.cubic))}>
          <Stage3Final response={stage3!} />
        </Animated.View>
      );
    }
    return null;
  };

  return (
    <View style={{ marginVertical: 8 }}>
      {/* Horizontal pill tab bar */}
      <StageFlowIndicator
        activeStage={getActiveStage()}
        selectedStage={selectedStage}
        onSelectStage={handleSelectStage}
        stage1Count={stage1.length}
        stage1Total={totalMembers}
      />

      {/* Content area — driven by selected stage tab */}
      {selectedStage !== null && (
        <View
          key={selectedStage}
          style={{
            marginTop: 4,
            marginHorizontal: 2,
            borderRadius: 16,
            overflow: "hidden",
            borderWidth: 1,
            borderColor:
              selectedStage === 1
                ? "#60a5fa33"
                : selectedStage === 2
                ? "#fbbf2433"
                : "#34d39933",
            backgroundColor: "#0d1524",
          }}
        >
          <View style={{ padding: 12 }}>{renderContent()}</View>
        </View>
      )}
    </View>
  );
}
