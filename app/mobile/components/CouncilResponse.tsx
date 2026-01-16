import { useState, useEffect, useRef } from "react";
import { View, Text } from "react-native";
import { MessageSquare, Trophy, Crown } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
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
import ExpandableSection from "./ExpandableSection";
import CouncilLoader from "./CouncilLoader";
import {
  useMeasuredHeight,
  useMeasuredHeightOnce,
} from "../lib/useMeasuredHeight";

interface CouncilResponseProps {
  stage1?: Stage1Response[];
  stage2?: Stage2Response[];
  stage3?: Stage3Response;
  aggregateRankings?: AggregateRanking[];
}

const ANIMATION_TOKENS = {
  stage1: { duration: 180, easing: Easing.bezier(0.2, 0.0, 0.0, 1.0) },
  stage2: { duration: 160, easing: Easing.bezier(0.2, 0.0, 0.0, 1.0) },
  stage3: { duration: 220, easing: Easing.bezier(0.2, 0.0, 0.0, 1.2) }, // Emphasized
};

export default function CouncilResponse({
  stage1 = [],
  stage2 = [],
  stage3,
  aggregateRankings,
}: CouncilResponseProps) {
  // Stage presence
  const hasStage1 = stage1 && stage1.length > 0;
  const hasStage2 = stage2 && stage2.length > 0;

  // State
  const [isConsulting, setIsConsulting] = useState(true);
  const [expandedStages, setExpandedStages] = useState({
    stage1: false,
    stage2: false,
    stage3: true,
  });

  // Refs for tracking changes
  const prevStage1Count = useRef(0);
  const hasStage3Arrived = useRef(false);

  // Layout Measurement Hooks
  const loaderMeasure = useMeasuredHeight();
  const stage1Measure = useMeasuredHeight();
  const stage2Measure = useMeasuredHeight();
  const stage3Measure = useMeasuredHeightOnce(); // Lock final answer height

  // Flow Line Animation Values
  const flowLineHeight = useSharedValue(0);
  const flowLineOpacity = useSharedValue(0);

  // Orchestration Effect
  useEffect(() => {
    // 1. Initial State: Consulting
    if (!hasStage1 && !hasStage2 && !stage3) {
      setIsConsulting(true);
      return;
    }

    const changes: Partial<typeof expandedStages> = {};

    // 2. Stage 1 Arrival
    if (hasStage1 && prevStage1Count.current === 0 && !stage3) {
      setIsConsulting(false); // Hide loader
      changes.stage1 = true; // Auto-expand Stage 1

      // Start Flow Line Growth
      flowLineOpacity.value = withTiming(0.6, { duration: 300 });
      // Grow to cover Stage 1 (heuristic + measurement could be used, but simple heuristic is stable)
      flowLineHeight.value = withTiming(40 + stage1Measure.height, {
        duration: 500,
      });
    } else if (hasStage1 && stage1Measure.height > 0 && !stage3) {
      // Dynamic update if needed, but keeping it stable is better
      // flowLineHeight.value = withTiming(40 + stage1Measure.height, { duration: 300 });
    }

    // 3. Stage 3 Arrival
    if (stage3 && !hasStage3Arrived.current) {
      setIsConsulting(false);
      changes.stage3 = true;
      changes.stage1 = false;
      changes.stage2 = false;
      hasStage3Arrived.current = true;

      // Flow Line Completes (grows full then fades)
      flowLineHeight.value = withTiming(800, { duration: 800 }); // Arbitrary tall value to "finish"
      flowLineOpacity.value = withDelay(1000, withTiming(0, { duration: 500 }));
    }

    if (Object.keys(changes).length > 0) {
      setExpandedStages((prev) => ({ ...prev, ...changes }));
    }

    prevStage1Count.current = stage1.length;
  }, [stage1.length, stage2.length, !!stage3]);

  const toggleStage = (stage: keyof typeof expandedStages) => {
    setExpandedStages((prev) => ({
      ...prev,
      [stage]: !prev[stage],
    }));
  };

  // Flow Line Style
  const flowLineStyle = useAnimatedStyle(() => ({
    height: flowLineHeight.value,
    opacity: flowLineOpacity.value,
  }));

  return (
    <View className="space-y-1 my-2 relative">
      {/* Flow Line - Absolute Positioned */}
      <Animated.View
        className="absolute left-3 top-5 w-0.5 bg-slate-700/50 rounded-full z-0"
        style={flowLineStyle}
      />

      {/* Consulting Loader */}
      {isConsulting && (
        <View onLayout={loaderMeasure.onLayout} className="mb-2">
          <CouncilLoader />
        </View>
      )}

      {/* Stage 1: Reasoning */}
      {hasStage1 && (
        <View onLayout={stage1Measure.onLayout}>
          <ExpandableSection
            title="STAGE 1 - REASON"
            expanded={expandedStages.stage1}
            onToggle={() => toggleStage("stage1")}
            accentColor="#60a5fa"
            icon={<MessageSquare size={14} color="#60a5fa" />}
            headerRight={
              !expandedStages.stage1 && (
                <Text className="text-xs text-muted-foreground mr-2">
                  {stage1.length} models
                </Text>
              )
            }
            duration={ANIMATION_TOKENS.stage1.duration}
            easingCurve={ANIMATION_TOKENS.stage1.easing}
          >
            <Stage1Tabs responses={stage1} />
          </ExpandableSection>
        </View>
      )}

      {/* Stage 2: Comparisons */}
      {hasStage2 && (
        <View onLayout={stage2Measure.onLayout}>
          <ExpandableSection
            title="STAGE 2 - COMPARE"
            expanded={expandedStages.stage2}
            onToggle={() => toggleStage("stage2")}
            accentColor="#fbbf24"
            icon={<Trophy size={14} color="#fbbf24" />}
            duration={ANIMATION_TOKENS.stage2.duration}
            easingCurve={ANIMATION_TOKENS.stage2.easing}
          >
            <Stage2Rankings
              rankings={stage2}
              aggregateRankings={aggregateRankings}
            />
          </ExpandableSection>
        </View>
      )}

      {/* Stage 3: Final Answer */}
      {stage3 && (
        <View onLayout={stage3Measure.onLayout}>
          <ExpandableSection
            title="STAGE 3 - RESULT"
            expanded={expandedStages.stage3}
            onToggle={() => toggleStage("stage3")}
            accentColor="#34d399"
            icon={<Crown size={14} color="#34d399" />}
            duration={ANIMATION_TOKENS.stage3.duration}
            easingCurve={ANIMATION_TOKENS.stage3.easing}
          >
            <Stage3Final response={stage3} />
          </ExpandableSection>
        </View>
      )}
    </View>
  );
}
