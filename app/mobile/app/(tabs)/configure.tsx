import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  TextInput,
  Switch,
} from "react-native";
import { Crown, Check, CheckCircle, Trash2 } from "lucide-react-native";
import { useUIStore } from "../../lib/store";
import { getFreeModels } from "../../lib/api";
import { Model } from "../../lib/types";
import { AnimatedButton } from "../../components/AnimatedButton";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

import { PRESETS } from "../../lib/presets";

function ConfigureScreen() {
  const {
    councilModels,
    chairmanModel,
    setCouncilModels,
    setChairmanModel,
    activePresetId,
    saveApiKey,
    clearApiKey,
  } = useUIStore();

  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Use Convex as source of truth for API key status
  const hasApiKeyInDB = useQuery(api.users.hasApiKey);
  const saveApiKeySecure = useAction(api.userActions.saveApiKeySecure);
  const clearApiKeyInDB = useMutation(api.users.clearApiKey);

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

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert("Error", "Please enter a valid API key");
      return;
    }

    setIsSaving(true);
    try {
      await saveApiKeySecure({ apiKey: apiKey.trim() });
      await saveApiKey(apiKey.trim());
      setApiKey("");
      Alert.alert(
        "API Key Saved",
        "Your API key has been encrypted and stored securely.",
      );
    } catch (error) {
      console.error("Failed to save API key:", error);
      Alert.alert("Error", "Failed to save API key. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearApiKey = () => {
    Alert.alert(
      "Remove API Key",
      "Are you sure you want to remove your API key?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await clearApiKeyInDB();
              await clearApiKey();
              Alert.alert("Success", "API key removed");
            } catch (error) {
              console.error("Failed to clear API key:", error);
              Alert.alert(
                "Error",
                "Failed to remove API key. Please try again.",
              );
            }
          },
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* API Configuration Section */}
        <View className="px-4 mb-4">
          <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            API Configuration
          </Text>
          <View className="bg-card rounded-xl border border-border overflow-hidden">
            <View className="p-4 border-b border-border">
              <Text className="text-base font-semibold text-foreground">
                OpenRouter API Key
              </Text>
              <Text className="text-sm text-muted-foreground mt-1">
                Bring your own key for unlimited free usage
              </Text>
            </View>

            {hasApiKeyInDB === undefined ? (
              <View className="p-4 items-center">
                <ActivityIndicator size="small" color="#6366f1" />
              </View>
            ) : hasApiKeyInDB ? (
              <View className="p-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <CheckCircle size={24} color="#10b981" className="mr-2" />
                    <Text className="text-green-500 font-medium">
                      API Key configured
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleClearApiKey}
                    className="p-2 bg-red-500/10 rounded-lg flex-row items-center"
                  >
                    <Trash2 size={16} color="#ef4444" />
                    <Text className="text-red-500 text-sm font-medium ml-1">
                      Remove
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View className="p-4">
                <View className="flex-row items-center mb-3">
                  <TextInput
                    className="flex-1 bg-secondary rounded-lg px-4 py-3 text-base text-foreground"
                    placeholder="sk-or-..."
                    placeholderTextColor="#6b7280"
                    value={apiKey}
                    onChangeText={setApiKey}
                    secureTextEntry={!showApiKey}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-sm text-muted-foreground">
                    Show API key
                  </Text>
                  <Switch
                    value={showApiKey}
                    onValueChange={setShowApiKey}
                    trackColor={{ false: "#374151", true: "#818cf8" }}
                    thumbColor={showApiKey ? "#6366f1" : "#9ca3af"}
                  />
                </View>
                <TouchableOpacity
                  onPress={handleSaveApiKey}
                  disabled={isSaving}
                  className="bg-primary rounded-lg py-3 items-center"
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#0f1419" />
                  ) : (
                    <Text className="text-background font-semibold">
                      Save API Key
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Manual Selection */}
        <View className="px-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Available Free Models
            </Text>
            <Text className="text-xs font-medium text-primary">
              {availableModels.length} models
            </Text>
          </View>

          {!hasApiKeyInDB ? (
            <View className="bg-card rounded-xl border border-border p-8 items-center">
              <Text className="text-muted-foreground text-center text-sm mb-2">
                🔑 API Key Required
              </Text>
              <Text className="text-muted-foreground text-center text-xs">
                Add your OpenRouter API key above to view available free models
              </Text>
            </View>
          ) : isLoading ? (
            <ActivityIndicator size="large" color="#6366f1" />
          ) : (
            <View className="bg-card rounded-xl overflow-hidden border border-border">
              {availableModels.map((model, index) => {
                const isSelected = councilModels.includes(model.id);
                const isChairman = chairmanModel === model.id;

                return (
                  <TouchableOpacity
                    key={model.id}
                    onPress={() => toggleModel(model.id)}
                    className={`p-4 border-b border-border flex-row items-center justify-between ${
                      councilModels.includes(model.id)
                        ? "bg-primary/10"
                        : "bg-card"
                    }`}
                  >
                    <View className="flex-1 pr-3">
                      <View className="flex-row items-center mb-1">
                        <Text
                          className={`text-base font-semibold ${
                            councilModels.includes(model.id)
                              ? "text-primary"
                              : "text-foreground"
                          }`}
                        >
                          {model.name}
                        </Text>
                      </View>
                      <Text className="text-xs text-muted-foreground mt-0.5 mb-1.5">
                        {model.provider && model.provider !== "Unknown"
                          ? model.provider
                          : "Model"}{" "}
                        • Context:{" "}
                        {model.context_length
                          ? `${(model.context_length / 1000).toFixed(0)}K`
                          : "N/A"}
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
                              !p.endsWith("Context"),
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
                  </TouchableOpacity>
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
