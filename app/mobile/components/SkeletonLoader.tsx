import React, { useEffect, useRef } from "react";
import { View, Animated, Easing } from "react-native";

export default function SkeletonLoader() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  const SkeletonItem = () => (
    <Animated.View 
      className="bg-card mx-4 my-2 p-4 rounded-xl border border-border shadow-sm"
      style={{ opacity }}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1 mr-4">
          <View className="h-5 bg-secondary rounded-md w-3/4 mb-2" />
          <View className="h-4 bg-muted rounded-md w-1/2" />
        </View>
        <View className="h-3 bg-muted rounded-md w-12" />
      </View>
    </Animated.View>
  );

  return (
    <View className="flex-1 bg-background py-2">
      <SkeletonItem />
      <SkeletonItem />
      <SkeletonItem />
      <SkeletonItem />
      <SkeletonItem />
      <SkeletonItem />
    </View>
  );
}
