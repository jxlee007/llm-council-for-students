import React from "react";
import { View, Text } from "react-native";
import { AlertTriangle } from "lucide-react-native";
import { Button } from "./ui/button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load the data. Please try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <View className="flex-1 items-center justify-center p-8 bg-background">
      <View className="w-24 h-24 bg-secondary rounded-full items-center justify-center mb-6">
        <AlertTriangle size={48} color="#ef4444" />
      </View>

      <Text className="text-2xl font-bold text-foreground text-center mb-2">
        {title}
      </Text>

      <Text className="text-muted-foreground text-center text-base mb-8 leading-6">
        {message}
      </Text>

      {onRetry && (
        <Button
          onPress={onRetry}
          label="Try Again"
          variant="destructive"
          size="lg"
          className="shadow-sm"
        />
      )}
    </View>
  );
}
