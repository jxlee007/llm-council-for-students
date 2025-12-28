import React, { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { ViewProps } from 'react-native';

interface Props extends ViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
}

/**
 * A View that fades in its content on mount.
 */
export function FadeInView({
  children,
  delay = 0,
  duration = 500,
  style,
  ...props
}: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration }));
    translateY.value = withDelay(delay, withTiming(0, { duration }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <Animated.View
      style={[style, animatedStyle]}
      {...props}
    >
      {children}
    </Animated.View>
  );
}
