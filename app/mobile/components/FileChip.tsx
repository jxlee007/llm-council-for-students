import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { FileText, X } from "lucide-react-native";

interface FileChipProps {
  name: string;
  onRemove: () => void;
}

/**
 * Visual chip for an attached file.
 * Shows file icon and name with X button on top right corner.
 */
export function FileChip({ name, onRemove }: FileChipProps) {
  return (
    <View className="relative w-20 h-20 rounded-xl overflow-hidden bg-secondary border border-border items-center justify-center">
      {/* File icon */}
      <FileText size={24} color="#6366f1" strokeWidth={1.5} />

      {/* File name */}
      <Text
        className="text-[10px] text-muted-foreground mt-1 px-1 text-center font-medium"
        numberOfLines={2}
      >
        {name}
      </Text>

      {/* X button on top right */}
      <TouchableOpacity
        onPress={onRemove}
        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 items-center justify-center"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <X size={14} color="#ffffff" strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}
