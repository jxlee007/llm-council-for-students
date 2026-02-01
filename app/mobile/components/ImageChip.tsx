import React from "react";
import { View, TouchableOpacity, Image } from "react-native";
import { X } from "lucide-react-native";

interface ImageChipProps {
  name: string;
  uri: string;
  onRemove: () => void;
}

/**
 * Visual chip for an attached image.
 * Shows thumbnail preview with X button on top left corner.
 */
export function ImageChip({ name, uri, onRemove }: ImageChipProps) {
  return (
    <View className="relative w-20 h-20 rounded-xl overflow-hidden border border-border">
      {/* Image thumbnail */}
      <Image source={{ uri }} className="w-full h-full" resizeMode="cover" />

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
