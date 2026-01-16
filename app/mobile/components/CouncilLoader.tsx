import { View, Text } from "react-native";
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  useAnimatedStyle,
  withDelay,
  withSequence,
  Easing,
  SharedValue,
} from "react-native-reanimated";
import { useEffect } from "react";

/**
 * Animated chat bubble loader indicating the council is being consulted.
 * Shows sequential pulsing bubbles.
 */
export default function CouncilLoader() {
  // 3 bubbles for the loader
  const bubble1 = useSharedValue(0.3);
  const bubble2 = useSharedValue(0.3);
  const bubble3 = useSharedValue(0.3);

  useEffect(() => {
    const pulse = (sharedVal: SharedValue<number>, delay: number) => {
      sharedVal.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.3, {
              duration: 400,
              easing: Easing.inOut(Easing.ease),
            })
          ),
          -1,
          true
        )
      );
    };

    pulse(bubble1, 0);
    pulse(bubble2, 200);
    pulse(bubble3, 400);
  }, []);

  const style1 = useAnimatedStyle(() => ({
    opacity: bubble1.value,
    transform: [{ scale: bubble1.value }],
  }));
  const style2 = useAnimatedStyle(() => ({
    opacity: bubble2.value,
    transform: [{ scale: bubble2.value }],
  }));
  const style3 = useAnimatedStyle(() => ({
    opacity: bubble3.value,
    transform: [{ scale: bubble3.value }],
  }));

  return (
    <View className="flex-row items-center space-x-3 py-4 px-2">
      {/* Loader Bubbles Container */}
      <View className="flex-row space-x-1 items-center bg-secondary/30 px-3 py-2 rounded-2xl">
        <Animated.View
          className="w-2 h-2 rounded-full bg-primary"
          style={style1}
        />
        <Animated.View
          className="w-2 h-2 rounded-full bg-primary"
          style={style2}
        />
        <Animated.View
          className="w-2 h-2 rounded-full bg-primary"
          style={style3}
        />
      </View>

      {/* Label */}
      <View>
        <Text className="text-sm font-medium text-foreground">
          Consulting council members
        </Text>
        <Text className="text-xs text-muted-foreground">
          Gathering perspectives...
        </Text>
      </View>
    </View>
  );
}
