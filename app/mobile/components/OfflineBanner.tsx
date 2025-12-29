import { useState, useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import * as Network from 'expo-network';
import { WifiOff } from 'lucide-react-native';
import Animated, { SlideInUp, SlideOutUp, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OfflineBanner() {
    const [isConnected, setIsConnected] = useState(true);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        // Initial check
        checkConnection();

        // Poll every 5s (Expo Network doesn't have a reliable cross-platform listener)
        const interval = setInterval(checkConnection, 5000);
        return () => clearInterval(interval);
    }, []);

    const checkConnection = async () => {
        try {
            const status = await Network.getNetworkStateAsync();
            setIsConnected(status.isConnected ?? true);
        } catch (e) {
            // If check fails, assume offline? Or ignore.
        }
    };

    if (isConnected) return null;

    return (
        <Animated.View
            entering={SlideInDown}
            exiting={SlideOutUp}
            className="absolute top-0 left-0 right-0 z-50 bg-amber-600 shadow-md"
            style={{ paddingTop: insets.top }}
        >
            <View className="px-4 py-2 flex-row items-center justify-center gap-2 pb-3">
                <WifiOff size={14} color="#fff" />
                <Text className="text-white font-bold text-xs">
                    Offline Mode: Council is paused
                </Text>
            </View>
        </Animated.View>
    );
}
