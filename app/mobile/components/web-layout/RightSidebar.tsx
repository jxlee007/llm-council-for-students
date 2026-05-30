import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Switch,
  Platform,
} from "react-native";
import { Crown, Check, Trash2, Key, HelpCircle, Settings, ShieldCheck, Cpu } from "lucide-react-native";
import { useUIStore } from "../../lib/store";
import { getFreeModels } from "../../lib/api";
import { Model } from "../../lib/types";
import { useCouncilConfig } from "../../hooks/useCouncilConfig";
import PresetsModal from "../PresetsModal";

const FALLBACK_MODELS: Model[] = [
  {
    id: "google/gemma-2-9b-it:free",
    name: "Gemma 2 9B It (Free)",
    provider: "Google",
    context_length: 8192,
    pricing: { prompt: "0.0", completion: "0.0" },
  },
  {
    id: "meta-llama/llama-3-8b-instruct:free",
    name: "Llama 3 8B Instruct (Free)",
    provider: "Meta",
    context_length: 8192,
    pricing: { prompt: "0.0", completion: "0.0" },
  },
  {
    id: "deepseek/deepseek-r1:free",
    name: "DeepSeek R1 (Free)",
    provider: "DeepSeek",
    context_length: 4096,
    pricing: { prompt: "0.0", completion: "0.0" },
  },
  {
    id: "qwen/qwen-2.5-coder-7b-instruct:free",
    name: "Qwen 2.5 Coder 7B (Free)",
    provider: "Alibaba",
    context_length: 32768,
    pricing: { prompt: "0.0", completion: "0.0" },
  },
];

export default function RightSidebar() {
  const {
    councilModels,
    chairmanModel,
    setCouncilModels,
    setChairmanModel,
    activePresetId,
    saveApiKey,
    clearApiKey,
    rightSidebarTab,
    setRightSidebarTab,
  } = useUIStore();

  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  // Connect to the config facade hook
  const { hasApiKey: hasApiKeyInDB, saveApiKeySecure, clearApiKeyInDB } = useCouncilConfig();

  useEffect(() => {
    if (hasApiKeyInDB) {
      loadModels();
    } else {
      setAvailableModels([]);
    }
  }, [hasApiKeyInDB]);

  const loadModels = async () => {
    setIsLoadingModels(true);
    try {
      const models = await getFreeModels();
      if (models && models.length > 0) {
        setAvailableModels(models);
      } else {
        throw new Error("Empty models list returned");
      }
    } catch (error: any) {
      console.warn("[RightSidebar] API network fallback activated:", error.message);
      setAvailableModels(FALLBACK_MODELS);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const toggleModel = (modelId: string) => {
    if (councilModels.includes(modelId)) {
      setCouncilModels(councilModels.filter((id) => id !== modelId));
    } else {
      if (councilModels.length >= 4) {
        alert("Council Full: You can only select up to 4 council members.");
        return;
      }
      setCouncilModels([...councilModels, modelId]);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) {
      alert("Error: Please enter a valid API key.");
      return;
    }

    setIsSavingKey(true);
    try {
      await saveApiKeySecure({ apiKey: apiKeyInput.trim() });
      await saveApiKey(apiKeyInput.trim());
      setApiKeyInput("");
      alert("Success: API key saved securely.");
    } catch (error) {
      console.error("Failed to save API key:", error);
      alert("Error: Failed to save API key. Please try again.");
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleClearApiKey = () => {
    if (confirm("Remove API Key: Are you sure you want to remove your OpenRouter API key?")) {
      clearApiKeyInDB()
        .then(() => clearApiKey())
        .then(() => alert("API key removed successfully."))
        .catch((error) => {
          console.error("Failed to clear API key:", error);
          alert("Error: Failed to remove API key.");
        });
    }
  };

  const formatModelName = (modelId: string) => {
    return modelId.split("/").pop()?.replace(":free", "") || modelId;
  };

  return (
    <View className="flex-1 bg-[#0f1419] flex-col justify-between border-l border-slate-800/80">
      {/* Scrollable Container */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 32 }}
      >
        {/* Header */}
        <View className="flex-row items-center mb-6 px-1">
          {rightSidebarTab === "models" ? (
            <Cpu size={18} color="#20c997" className="mr-2" />
          ) : (
            <Settings size={18} color="#20c997" className="mr-2" />
          )}
          <Text className="text-sm font-bold text-white uppercase tracking-wider">
            {rightSidebarTab === "models" ? "Available Free Models" : "Settings"}
          </Text>
        </View>

        {rightSidebarTab === "models" ? (
          // AVAILABLE FREE MODELS TAB
          <View>
            {/* Active Preset Section */}
            <View className="mb-6">
              <Text className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5 px-1">
                Active Preset
              </Text>

              <TouchableOpacity
                onPress={() => setShowPresets(true)}
                className="bg-slate-900/40 border border-slate-800 rounded-xl p-3.5 flex-row justify-between items-center hover:border-slate-700/60 transition-all duration-150"
              >
                <View className="flex-1 pr-2">
                  <Text className="text-white text-xs font-semibold mb-0.5">
                    Preset Mode
                  </Text>
                  <Text className="text-[#20c997] text-xs font-bold capitalize">
                    {activePresetId || "Custom Selection"}
                  </Text>
                </View>
                <Text className="text-slate-500 text-lg font-bold">›</Text>
              </TouchableOpacity>
            </View>

            {/* Available Models Configuration Section */}
            <View className="mb-6">
              <View className="flex-row justify-between items-center mb-2.5 px-1">
                <Text className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Available Models
                </Text>
                {hasApiKeyInDB && (
                  <Text className="text-[9px] font-bold text-[#20c997] uppercase">
                    {availableModels.length} Loaded
                  </Text>
                )}
              </View>

              {!hasApiKeyInDB ? (
                <View className="bg-slate-900/40 border border-dashed border-slate-800 rounded-xl p-6 items-center justify-center">
                  <Key size={24} color="#475569" className="mb-2" />
                  <Text className="text-slate-400 text-[11px] text-center mb-4 leading-4">
                    Configure your OpenRouter API key in settings to load available free models.
                  </Text>
                  <TouchableOpacity
                    onPress={() => setRightSidebarTab("settings")}
                    className="bg-[#20c997] rounded-xl px-4 py-2 hover:bg-[#1bb386] active:bg-[#1bb386]"
                  >
                    <Text className="text-[#0f1419] font-bold text-xs">
                      Go to Settings
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : isLoadingModels ? (
                <View className="py-8 justify-center items-center">
                  <ActivityIndicator size="small" color="#20c997" />
                  <Text className="text-slate-500 text-[10px] mt-2">Loading models...</Text>
                </View>
              ) : availableModels.length === 0 ? (
                <View className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 items-center justify-center">
                  <Text className="text-slate-500 text-[11px] text-center">
                    No free models available. Check connection or key status.
                  </Text>
                </View>
              ) : (
                <View className="bg-slate-900/20 border border-slate-800 rounded-xl overflow-hidden">
                  {availableModels.map((model) => {
                    const isSelected = councilModels.includes(model.id);
                    const isChairman = chairmanModel === model.id;

                    return (
                      <View
                        key={model.id}
                        className={`p-3 border-b border-slate-800/80 flex-row items-center justify-between ${
                          isSelected ? "bg-slate-800/10" : "bg-transparent"
                        }`}
                      >
                        <View className="flex-1 pr-2">
                          <Text
                            className={`text-xs font-semibold truncate ${
                              isSelected ? "text-[#20c997]" : "text-slate-300"
                            }`}
                            numberOfLines={1}
                          >
                            {model.name}
                          </Text>
                          <Text className="text-[10px] text-slate-500 mt-0.5 capitalize">
                            {model.provider}
                          </Text>
                        </View>

                        <View className="flex-row items-center gap-1.5">
                          {/* Chairman Crown Toggle */}
                          <TouchableOpacity
                            onPress={() => setChairmanModel(isChairman ? null : model.id)}
                            className={`w-7 h-7 rounded-md items-center justify-center border ${
                              isChairman
                                ? "bg-amber-500/10 border-amber-500/30"
                                : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
                            }`}
                          >
                            <Crown
                              size={13}
                              color={isChairman ? "#fbbf24" : "#64748b"}
                              fill={isChairman ? "#fbbf24" : "none"}
                            />
                          </TouchableOpacity>

                          {/* Council Member Check Toggle */}
                          <TouchableOpacity
                            onPress={() => toggleModel(model.id)}
                            className={`w-7 h-7 rounded-md items-center justify-center border ${
                              isSelected
                                ? "bg-[#20c997]/15 border-[#20c997]/30"
                                : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
                            }`}
                          >
                            {isSelected && (
                              <Check size={13} color="#20c997" strokeWidth={3} />
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        ) : (
          // SETTINGS TAB
          <View>
            {/* API Configuration Section */}
            <View className="mb-6">
              <Text className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5 px-1">
                API Configuration
              </Text>

              <View className="bg-slate-900/40 border border-slate-800 rounded-xl p-3.5">
                <Text className="text-white text-xs font-semibold mb-1">
                  OpenRouter Key
                </Text>
                <Text className="text-[11px] text-slate-400 mb-3 leading-4">
                  Enter key for free model usage. Get one at{" "}
                  <Text className="text-[#20c997] underline">openrouter.ai</Text>
                </Text>

                {hasApiKeyInDB === undefined ? (
                  <ActivityIndicator size="small" color="#20c997" className="py-2" />
                ) : hasApiKeyInDB ? (
                  <View className="flex-row items-center justify-between bg-[#20c997]/5 border border-[#20c997]/20 rounded-lg p-2.5">
                    <View className="flex-row items-center">
                      <ShieldCheck size={16} color="#20c997" className="mr-2" />
                      <Text className="text-[#20c997] text-xs font-medium">
                        Active
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={handleClearApiKey}
                      className="flex-row items-center bg-red-500/10 hover:bg-red-500/15 px-2 py-1 rounded"
                    >
                      <Trash2 size={12} color="#ef4444" className="mr-1" />
                      <Text className="text-red-400 text-[10px] font-bold">Remove</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View className="space-y-3">
                    <TextInput
                      className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none"
                      style={Platform.OS === "web" ? { outlineStyle: "none" } as any : {}}
                      placeholder="sk-or-..."
                      placeholderTextColor="#475569"
                      value={apiKeyInput}
                      onChangeText={setApiKeyInput}
                      secureTextEntry={!showApiKey}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    
                    <View className="flex-row items-center justify-between py-1">
                      <Text className="text-slate-400 text-[11px]">Show API key</Text>
                      <Switch
                        value={showApiKey}
                        onValueChange={setShowApiKey}
                        trackColor={{ false: "#1e293b", true: "#20c997/40" }}
                        thumbColor={showApiKey ? "#20c997" : "#64748b"}
                      />
                    </View>

                    <TouchableOpacity
                      onPress={handleSaveApiKey}
                      disabled={isSavingKey}
                      className="bg-[#20c997] rounded-lg py-2 items-center active:bg-[#1bb386]"
                    >
                      {isSavingKey ? (
                        <ActivityIndicator size="small" color="#0f1419" />
                      ) : (
                        <Text className="text-[#0f1419] font-bold text-xs">
                          Save Key
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Preset Modal Container */}
      <PresetsModal
        visible={showPresets}
        onClose={() => setShowPresets(false)}
      />
    </View>
  );
}
