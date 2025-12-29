import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LucideIcon } from "lucide-react-native";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  loading?: boolean;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  loading = false,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center p-8 bg-gray-50">
      <View className="w-24 h-24 bg-indigo-50 rounded-full items-center justify-center mb-6">
        <Icon size={48} color="#4f46e5" />
      </View>
      
      <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
        {title}
      </Text>
      
      <Text className="text-gray-500 text-center text-base mb-8 leading-6">
        {description}
      </Text>
      
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          disabled={loading}
          activeOpacity={0.8}
          className="bg-indigo-600 px-8 py-4 rounded-2xl shadow-sm"
        >
          <Text className="text-white font-bold text-lg">
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
