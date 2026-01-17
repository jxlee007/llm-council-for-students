import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
  FadeInDown,
} from "react-native-reanimated";
import { useUIStore } from "../lib/store";
import { PRESETS, PRESET_ICONS } from "../lib/presets";
import { Check } from "lucide-react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface PresetsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PresetsModal({ visible, onClose }: PresetsModalProps) {
  const {
    setCouncilModels,
    setChairmanModel,
    activePresetId,
    setActivePresetId,
  } = useUIStore();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, {
        duration: 250,
        easing: Easing.in(Easing.cubic),
      });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleSelectPreset = (key: string) => {
    const preset = PRESETS[key];
    // Set models first (store will auto-detect and set activePresetId)
    setCouncilModels(preset.members, key);
    setChairmanModel(preset.chairman, key);
  };

  // Helper to check if a preset is active
  const isPresetActive = (key: string) => {
    return activePresetId === key;
  };

  if (!visible && opacity.value === 0) return null;

  return (
    <View
      className="absolute inset-0 z-[2000] justify-end"
      pointerEvents={visible ? "auto" : "none"}
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          className="absolute inset-0 bg-black/60"
          style={overlayStyle}
        />
      </TouchableWithoutFeedback>

      {/* Modal Sheet */}
      <Animated.View
        className="bg-card rounded-t-3xl border-t border-border shadow-2xl overflow-hidden pt-4 pb-10 max-h-[85%]"
        style={sheetStyle}
      >
        <View className="items-center mb-4">
          <View className="w-12 h-1.5 bg-muted rounded-full" />
        </View>

        <View className="px-6 mb-4">
          <Text className="text-xl font-bold text-foreground">
            Select a Council Preset
          </Text>
          <Text className="text-muted-foreground text-sm mt-1">
            Build your team instantly for specific tasks.
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        >
          {Object.entries(PRESETS).map(([key, preset], index) => {
            const Icon = PRESET_ICONS[key as keyof typeof PRESET_ICONS];
            const isActive = isPresetActive(key);

            return (
              <TouchableOpacity
                key={key}
                onPress={() => handleSelectPreset(key)}
                activeOpacity={0.7}
                className={`flex-row items-center p-4 mb-3 rounded-2xl border ${
                  isActive
                    ? "bg-primary/10 border-primary"
                    : "bg-muted/30 border-border"
                }`}
              >
                <View
                  className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${
                    isActive
                      ? "bg-primary/20"
                      : "bg-muted/50 border border-border"
                  }`}
                >
                  {Icon && (
                    <Icon size={24} color={isActive ? "#6366f1" : "#94a3b8"} />
                  )}
                </View>

                <View className="flex-1">
                  <Text
                    className={`font-semibold text-base ${
                      isActive ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {preset.label}
                  </Text>
                  <Text className="text-muted-foreground text-xs mt-0.5">
                    {preset.description}
                  </Text>
                </View>

                {isActive && (
                  <View className="bg-primary rounded-full p-1 ml-2">
                    <Check size={14} color="white" strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>
    </View>
  );
}
