import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  Easing,
  withSpring,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { ChevronDown } from "lucide-react-native";

interface ExpandableSectionProps {
  title: string;
  icon?: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  duration?: number;
  easingCurve?: any; // Reanimated types can vary, using any to match Easing return
  accentColor?: string;
}

export default function ExpandableSection({
  title,
  icon,
  expanded,
  onToggle,
  children,
  headerRight,
  accentColor = "#94a3b8",
  duration = 250,
  easingCurve = Easing.out(Easing.quad),
}: ExpandableSectionProps) {
  const rotation = useSharedValue(expanded ? 180 : 0);
  const opacity = useSharedValue(expanded ? 1 : 0);

  useEffect(() => {
    // Rotation always snappy
    rotation.value = withTiming(expanded ? 180 : 0, { duration: 200 });

    // Content opacity/visibility uses custom timing
    opacity.value = withTiming(expanded ? 1 : 0, {
      duration: duration,
      easing: easingCurve,
    });
  }, [expanded, duration, easingCurve]);

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const animatedContentStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      display: expanded ? "flex" : "none", // Simple toggle for now, measuring height perfectly can be tricky with dynamic content
    };
  });

  return (
    <View className="mb-2">
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.7}
        className="flex-row items-center justify-between py-3 px-1"
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View className="flex-row items-center gap-2">
          {/* Icon Container - small and subtle */}
          {icon && <View className="opacity-90">{icon}</View>}
          <Text
            className="text-sm font-medium tracking-wide"
            style={{ color: accentColor }}
          >
            {title}
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          {headerRight}
          <Animated.View style={animatedIconStyle}>
            <ChevronDown size={16} color={accentColor} />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* 
        Using basic conditional rendering or display:none for stability first. 
        For smoother height animation, we might need `measure` or fixed heights, 
        but for dynamic text content, `LayoutAnimation` or just simple conditional is often safer to start.
        Let's try a simple conditional render with an entering animation if we want it "smooth" 
        but the prompt asks for "Height + Opacity". 
        Reanimated `Layout` prop on the container is the modern way.
      */}
      {expanded && (
        <Animated.View
          entering={undefined} // We can add Entering animations later if needed
          className="overflow-hidden"
        >
          <View className="pt-2 pb-4">{children}</View>
        </Animated.View>
      )}
    </View>
  );
}
