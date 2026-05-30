import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
  TextInput,
  Modal,
  Platform,
} from "react-native";
import { useUIStore } from "../lib/store";
import { PRESETS, PRESET_ICONS, generateDynamicPreset } from "../lib/presets";
import { Check, Edit2, X } from "lucide-react-native";

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
    customSystemPrompts,
    updateCustomSystemPrompt,
    hasApiKey,
  } = useUIStore();

  const [expandedPreset, setExpandedPreset] = useState<string | null>(null);
  const [lastTap, setLastTap] = useState<{ key: string; time: number } | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  useEffect(() => {
    if (visible && hasApiKey && !isLoadingModels) {
      setIsLoadingModels(true);
      fetchModelsIfNeeded().finally(() => setIsLoadingModels(false));
    }
  }, [visible, hasApiKey]);

  const handleSelectPreset = (key: string) => {
    if (!hasApiKey) {
      alert("API Key Required: Please configure your OpenRouter API key in settings to load available models and presets.");
      return;
    }
    if (availableModels.length === 0) {
      alert("No models loaded yet. Please configure your API key and wait for models to sync.");
      return;
    }
    
    const generated = generateDynamicPreset(key, availableModels);
    if (generated) {
      setCouncilModels(generated.members, key);
      setChairmanModel(generated.chairman, key);
    }
  };

  const handlePress = (key: string) => {
    const now = Date.now();
    if (lastTap && lastTap.key === key && now - lastTap.time < 300) {
      // Double click / tap -> Toggle expanded editor
      setExpandedPreset(expandedPreset === key ? null : key);
      setLastTap(null);
    } else {
      // Single click / tap -> Select
      handleSelectPreset(key);
      setLastTap({ key, time: now });
    }
  };

  const isPresetActive = (key: string) => {
    return activePresetId === key;
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-center items-center bg-black/70 p-4">
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View className="w-full max-w-lg bg-[#0f1419] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex-col max-h-[85vh]">
              {/* Header */}
              <View className="p-5 border-b border-slate-800 flex-row justify-between items-center bg-[#151c24]">
                <View>
                  <Text className="text-white text-lg font-bold">
                    Select a Council Preset
                  </Text>
                  <Text className="text-slate-400 text-xs mt-1">
                    Click to select. Double click or press edit icon to customize system prompt.
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  className="p-2 hover:bg-slate-800 rounded-full"
                >
                  <X size={18} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              {/* Presets List */}
              <ScrollView className="flex-1 p-5">
                {Object.entries(PRESETS).map(([key, preset]) => {
                  const Icon = PRESET_ICONS[key as keyof typeof PRESET_ICONS];
                  const isActive = isPresetActive(key);
                  const isExpanded = expandedPreset === key;

                  return (
                    <View
                      key={key}
                      className={`mb-3.5 rounded-xl border overflow-hidden ${
                        isActive
                          ? "bg-[#20c997]/5 border-[#20c997]/40"
                          : "bg-[#181d24] border-slate-800/80"
                      }`}
                    >
                      <TouchableOpacity
                        onPress={() => handlePress(key)}
                        activeOpacity={0.75}
                        className="p-4 flex-row items-center justify-between"
                      >
                        <View className="flex-row items-center flex-1 pr-3">
                          <View
                            className={`w-10 h-10 rounded-full items-center justify-center mr-3.5 ${
                              isActive
                                ? "bg-[#20c997]/15"
                                : "bg-slate-800/50 border border-slate-700/40"
                            }`}
                          >
                            {Icon && (
                              <Icon
                                size={20}
                                color={isActive ? "#20c997" : "#94a3b8"}
                              />
                            )}
                          </View>

                          <View className="flex-1">
                            <Text
                              className={`font-semibold text-sm ${
                                isActive ? "text-[#20c997]" : "text-white"
                              }`}
                            >
                              {preset.label}
                            </Text>
                            <Text className="text-slate-400 text-xs mt-0.5">
                              {preset.description}
                            </Text>
                          </View>
                        </View>

                        <View className="flex-row items-center gap-1.5">
                          {/* Edit prompt shortcut button */}
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              setExpandedPreset(isExpanded ? null : key);
                            }}
                            className={`p-2 rounded-lg hover:bg-slate-700/50 ${
                              isExpanded ? "bg-slate-700/40" : ""
                            }`}
                          >
                            <Edit2 size={14} color="#94a3b8" />
                          </TouchableOpacity>

                          {isActive && (
                            <View className="bg-[#20c997] rounded-full p-0.5 ml-1">
                              <Check size={12} color="#0f1419" strokeWidth={3.5} />
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>

                      {/* Expanded System Prompt Editor */}
                      {isExpanded && (
                        <View className="px-4 pb-4 pt-1 border-t border-slate-800/60 bg-[#0f1419]/40">
                          <Text className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">
                            System Role Prompt
                          </Text>
                          
                          <TextInput
                            className="bg-[#181d24] border border-slate-800 rounded-xl p-3 text-xs text-white min-h-[90px] outline-none"
                            style={Platform.OS === "web" ? { outlineStyle: "none" } as any : {}}
                            multiline
                            value={customSystemPrompts[key] ?? preset.system_prompt}
                            onChangeText={(text) => updateCustomSystemPrompt(key, text)}
                            placeholder="Enter system prompt guidelines..."
                            placeholderTextColor="#64748b"
                            textAlignVertical="top"
                          />
                          
                          <Text className="text-[10px] text-slate-500 mt-2 px-1 italic">
                            Saved automatically. This guides all models in this council preset.
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>

              {/* Footer */}
              <View className="p-4 border-t border-slate-800 flex-row justify-end gap-3 bg-[#151c24]">
                <TouchableOpacity
                  onPress={onClose}
                  className="bg-[#20c997] px-5 py-2.5 rounded-xl hover:bg-[#1bb386]"
                >
                  <Text className="text-[#0f1419] font-bold text-sm">
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
