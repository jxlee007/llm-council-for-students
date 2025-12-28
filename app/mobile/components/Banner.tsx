import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react-native';

interface Props {
  message: string;
  type?: 'error' | 'warning' | 'info';
  onDismiss?: () => void;
}

/**
 * A banner component for displaying alerts at the top of the screen.
 */
export function Banner({ message, type = 'error', onDismiss }: Props) {
  const bgColors = {
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-indigo-600',
  };

  const Icon = {
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }[type];

  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      exiting={FadeOutUp.duration(300)}
      className={`absolute top-0 left-0 right-0 z-50 p-4 pt-12 ${bgColors[type]}`}
    >
      <View className="flex-row items-center">
        <Icon size={20} color="#fff" />
        <Text className="text-white font-medium flex-1 ml-3 mr-2 shadow-sm">
          {message}
        </Text>
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} className="p-1">
            <X size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}
