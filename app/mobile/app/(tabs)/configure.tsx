import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Crown, Check } from "lucide-react-native";
import { useUIStore } from "../../lib/store";
import { getFreeModels } from "../../lib/api";
import { Model } from "../../lib/types";
import { AnimatedButton } from "../../components/AnimatedButton";

import { PRESETS } from "../../lib/presets";

function ConfigureScreen() {
  const {
    councilModels,
    chairmanModel,
    setCouncilModels,
    setChairmanModel,
    activePresetId,
  } = useUIStore();

  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    setIsLoading(true);
    try {
      const models = await getFreeModels();
      setAvailableModels(models);
    } catch (error) {
      console.error("Failed to load models:", error);
      Alert.alert("Error", "Failed to fetch available models");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleModel = (modelId: string) => {
    if (councilModels.includes(modelId)) {
      setCouncilModels(councilModels.filter((id) => id !== modelId));
    } else {
      if (councilModels.length >= 4) {
        Alert.alert("Council Full", "You can only select 4 council members.");
        return;
      }
      setCouncilModels([...councilModels, modelId]);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="p-6 bg-white border-b border-gray-100">
          <Text className="text-2xl font-bold text-gray-900">
            Council Configuration
          </Text>
          <Text className="text-gray-500 mt-1">
            Select a specialized team or build your own council.
          </Text>
        </View>

        {/* Active Configuration */}
        <View className="px-4 py-2 mb-4">
          <View className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            {activePresetId && PRESETS[activePresetId] && (
              <View className="flex-row mb-3">
                <View className="bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
                  <Text className="text-indigo-600 text-xs font-semibold">
                    {PRESETS[activePresetId].label} Model Set
                  </Text>
                </View>
              </View>
            )}

            <View className="mb-2">
              <Text className="text-sm font-semibold text-gray-900">
                Current Council ({councilModels.length}/4)
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {councilModels.length === 0 ? (
                <Text className="text-gray-400 italic text-sm">
                  No models selected
                </Text>
              ) : (
                councilModels.map((id) => (
                  <View key={id} className="bg-indigo-100 px-2 py-1 rounded-md">
                    <Text className="text-indigo-800 text-xs" numberOfLines={1}>
                      {id.split("/")[1] || id}
                    </Text>
                  </View>
                ))
              )}
            </View>

            <Text className="text-sm font-semibold text-gray-900 mt-4 mb-2">
              Chairman
            </Text>
            <View className="bg-amber-100 self-start px-3 py-1 rounded-md border border-amber-200 flex-row items-center">
              <Crown size={12} color="#92400e" className="mr-1.5" />
              <Text className="text-amber-900 text-xs font-bold">
                {chairmanModel
                  ? chairmanModel.split("/")[1] || chairmanModel
                  : "Default (Gemini 2.0)"}
              </Text>
            </View>
          </View>
        </View>

        {/* Manual Selection */}
        <View className="px-4">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Available Free Models
          </Text>

          {isLoading ? (
            <ActivityIndicator size="large" color="#4f46e5" />
          ) : (
            <View className="bg-white rounded-xl overflow-hidden border border-gray-100">
              {availableModels.map((model, index) => {
                const isSelected = councilModels.includes(model.id);
                const isChairman = chairmanModel === model.id;

                return (
                  <View
                    key={model.id}
                    className={`p-4 border-b border-gray-50 flex-row items-center justify-between ${
                      isSelected ? "bg-indigo-50/50" : ""
                    }`}
                  >
                    <View className="flex-1 mr-4">
                      <Text className="font-medium text-gray-900">
                        {model.name}
                      </Text>
                      <Text className="text-xs text-gray-500 mt-0.5 mb-1.5">
                        {model.provider && model.provider !== "Unknown"
                          ? model.provider
                          : "Model"}{" "}
                        : {Math.round(model.context_length / 1024)}k context
                      </Text>

                      {/* UI Pills */}
                      <View className="flex-row flex-wrap gap-1.5">
                        {model.rankings?.map((rank, i) => (
                          <View
                            key={`rank-${i}`}
                            className="bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-md"
                          >
                            <Text className="text-[10px] text-amber-700 font-medium">
                              {rank}
                            </Text>
                          </View>
                        ))}
                        {model.ui_pills
                          ?.filter(
                            (p) =>
                              p !== "Free" &&
                              p !== "Unknown" &&
                              !p.endsWith("Context")
                          )
                          .map((pill, i) => (
                            <View
                              key={i}
                              className="bg-gray-100 px-1.5 py-0.5 rounded-md"
                            >
                              <Text className="text-[10px] text-gray-600 font-medium">
                                {pill}
                              </Text>
                            </View>
                          ))}
                      </View>
                    </View>

                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() =>
                          setChairmanModel(isChairman ? null : model.id)
                        }
                        className={`p-2 rounded-lg border ${
                          isChairman
                            ? "bg-amber-100 border-amber-300"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <Crown
                          size={18}
                          color={isChairman ? "#92400e" : "#9ca3af"}
                        />
                      </TouchableOpacity>

                      <AnimatedButton
                        onPress={() => toggleModel(model.id)}
                        className={`w-8 h-8 rounded-full items-center justify-center border ${
                          isSelected
                            ? "bg-indigo-600 border-indigo-600"
                            : "bg-white border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <Check size={16} color="#fff" strokeWidth={3} />
                        )}
                      </AnimatedButton>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

export default ConfigureScreen;
