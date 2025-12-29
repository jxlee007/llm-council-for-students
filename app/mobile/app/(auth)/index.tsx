import { useState, useRef } from 'react';
import { View, Text, FlatList, useWindowDimensions, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/button';
import { Handshake, Key, Zap, ArrowRight } from 'lucide-react-native';
import { cn } from '../../lib/utils';

const ONBOARDING_DATA = [
    {
        id: '1',
        title: 'Multiple AI Models Debate',
        description: 'Get expert answers from 4+ AI models discussing your question together.',
        icon: Handshake,
        color: '#3b82f6', // blue
    },
    {
        id: '2',
        title: 'Free Forever with Your Key',
        description: 'Bring your own OpenRouter key for unlimited access to free AI models.',
        icon: Key,
        color: '#10b981', // green/emerald
    },
    {
        id: '3',
        title: 'Premium Power',
        description: 'Unlock GPT-4o, Claude Opus, and Gemini Pro for just ₹149/month.',
        icon: Zap,
        color: '#a855f7', // purple
    },
];

export default function OnboardingScreen() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / width);
        setCurrentIndex(index);
    };

    const handleNext = () => {
        if (currentIndex < ONBOARDING_DATA.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            router.push('/(auth)/login');
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
            <FlatList
                ref={flatListRef}
                data={ONBOARDING_DATA}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                    const Icon = item.icon;
                    return (
                        <View style={{ width }} className="items-center justify-center px-8">
                            <View className="mb-8 p-6 rounded-full bg-secondary">
                                <Icon size={64} color={item.color} />
                            </View>
                            <Text className="text-3xl font-bold text-foreground text-center mb-4">
                                {item.title}
                            </Text>
                            <Text className="text-lg text-muted-foreground text-center leading-relaxed">
                                {item.description}
                            </Text>
                        </View>
                    );
                }}
            />

            {/* Footer with Dots and Button */}
            <View className="px-8 pb-8">
                {/* Dots */}
                <View className="flex-row justify-center mb-8 gap-2">
                    {ONBOARDING_DATA.map((_, index) => (
                        <View
                            key={index}
                            className={cn(
                                "h-2 rounded-full",
                                index === currentIndex ? "w-8 bg-primary" : "w-2 bg-muted"
                            )}
                        />
                    ))}
                </View>

                <Button
                    onPress={handleNext}
                    size="lg"
                    className="w-full"
                >
                    <Text className="text-primary-foreground font-bold text-lg mr-2">
                        {currentIndex === ONBOARDING_DATA.length - 1 ? "Get Started" : "Next"}
                    </Text>
                    <ArrowRight size={20} color="#0f1419" />
                </Button>
            </View>
        </SafeAreaView>
    );
}
