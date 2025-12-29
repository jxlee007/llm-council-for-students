import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { FileText, X } from "lucide-react-native";

interface FileChipProps {
  name: string;
  onRemove: () => void;
}

/**
 * Visual chip for an attached file.
 * Shows filename and a remove button.
 */
export function FileChip({ name, onRemove }: FileChipProps) {
  return (
    <View className="flex-row items-center bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 self-start mb-2 mr-2">
      <FileText size={14} color="#4f46e5" className="mr-1.5" />
      <Text className="text-indigo-700 text-xs font-medium mr-2" numberOfLines={1}>
        {name}
      </Text>
      <TouchableOpacity onPress={onRemove} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <X size={14} color="#4f46e5" />
      </TouchableOpacity>
    </View>
  );
}
