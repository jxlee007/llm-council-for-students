import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

interface Props {
  message: string;
  type?: 'error' | 'warning' | 'info';
  onDismiss?: () => void;
}

/**
 * A banner component for displaying alerts at the top of the screen.
 */
export function Banner({ message, type = 'error' }: Props) {
  const bgColors = {
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  };

  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      exiting={FadeOutUp.duration(300)}
      className={`absolute top-0 left-0 right-0 z-50 p-4 pt-12 ${bgColors[type]}`}
    >
      <View className="flex-row items-center justify-center">
        <Text className="text-white font-medium text-center shadow-sm">
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}
