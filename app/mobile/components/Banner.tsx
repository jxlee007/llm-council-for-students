import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  RefreshCw,
} from "lucide-react-native";

interface BannerAction {
  label: string;
  onPress: () => void;
}

interface Props {
  message: string;
  type?: "error" | "warning" | "info";
  onDismiss?: () => void;
  action?: BannerAction;
}

/**
 * A banner component for displaying alerts at the top of the screen.
 * Supports optional action button for retry functionality.
 */
export function Banner({ message, type = "error", onDismiss, action }: Props) {
  const bgColors = {
    error: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-indigo-600",
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
        {action && (
          <TouchableOpacity
            onPress={action.onPress}
            className="flex-row items-center bg-white/20 px-3 py-1.5 rounded-full mr-2"
          >
            <RefreshCw size={14} color="#fff" />
            <Text className="text-white font-semibold text-sm ml-1.5">
              {action.label}
            </Text>
          </TouchableOpacity>
        )}
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} className="p-1">
            <X size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}
