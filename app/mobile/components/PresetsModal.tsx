import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  TouchableWithoutFeedback,
  ActivityIndicator,
  TextInput,
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
import { PRESETS, PRESET_ICONS, generateDynamicPreset } from "../lib/presets";
import { getFreeModels } from "../lib/api";
import { Model } from "../lib/types";
import { Check, Loader2 } from "lucide-react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface PresetsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PresetsModal({ visible, onClose }: PresetsModalProps) {
  const {
    availableModels,
    fetchModelsIfNeeded,
    setCouncilModels,
    setChairmanModel,
    activePresetId,
    setActivePresetId,
    customSystemPrompts,
    updateCustomSystemPrompt,
  } = useUIStore();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);

  const [expandedPreset, setExpandedPreset] = useState<string | null>(null);
  const [lastTap, setLastTap] = useState<{ key: string; time: number } | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
      opacity.value = withTiming(1, { duration: 200 });

      // Fetch models if not already loaded or cache expired
      if (!isLoadingModels) {
        setIsLoadingModels(true);
        fetchModelsIfNeeded()
          .finally(() => setIsLoadingModels(false));
      }

    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, {
        duration: 250,
        easing: Easing.in(Easing.cubic),
      });
      opacity.value = withTiming(0, { duration: 200 });
      // reset expansion state on close
      setTimeout(() => setExpandedPreset(null), 300);
    }
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleSelectPreset = (key: string) => {
    if (availableModels.length === 0) return;
    
    const generated = generateDynamicPreset(key, availableModels);
    if (generated) {
      setCouncilModels(generated.members, key);
      setChairmanModel(generated.chairman, key);
    }
  };

  const handlePress = (key: string) => {
    const now = Date.now();
    if (lastTap && lastTap.key === key && now - lastTap.time < 300) {
      // Double tap
      setExpandedPreset(expandedPreset === key ? null : key);
      setLastTap(null); // Reset tap to prevent triple tap from toggling again
    } else {
      // Single tap
      handleSelectPreset(key);
      setLastTap({ key, time: now });
    }
  };

  // Helper to check if a preset is active
  const isPresetActive = (key: string) => {
    return activePresetId === key;
  };

  const formatModelName = (modelId: string) => {
    return modelId.split('/').pop()?.replace(':free', '') || modelId;
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
            Single tap to select. Double tap to edit system prompt.
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        >
          {Object.entries(PRESETS).map(([key, preset], index) => {
            const Icon = PRESET_ICONS[key as keyof typeof PRESET_ICONS];
            const isActive = isPresetActive(key);
            const isExpanded = expandedPreset === key;

            return (
              <TouchableOpacity
                key={key}
                onPress={() => handlePress(key)}
                activeOpacity={0.7}
                className={`p-4 mb-3 rounded-2xl border ${
                  isActive
                    ? "bg-primary/10 border-primary"
                    : "bg-muted/30 border-border"
                }`}
              >
                <View className="flex-row items-center">
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
                </View>

                {/* Expanded Prompt Editor */}
                {isExpanded && (
                  <View className="mt-4 pt-4 border-t border-border/50">
                    <Text className="text-xs font-semibold text-muted-foreground mb-3 flex-row items-center">
                      SYSTEM ROLE PROMPT
                    </Text>
                    
                    <TextInput
                      className="bg-muted/50 border border-border/50 rounded-xl p-3 text-sm text-foreground min-h-[100px]"
                      multiline
                      value={customSystemPrompts[key] ?? preset.system_prompt}
                      onChangeText={(text) => updateCustomSystemPrompt(key, text)}
                      placeholder="Enter system prompt here..."
                      placeholderTextColor="#94a3b8"
                      textAlignVertical="top"
                    />
                    
                    <Text className="text-[10px] text-muted-foreground mt-2 italic">
                      This prompt guides all models in the council. Changes are saved automatically.
                    </Text>
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

