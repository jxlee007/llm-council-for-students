import { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useStore, loadConversationFromStorage } from "../../lib/store";
import { createConversation, getConversations } from "../../lib/api";
import type { ConversationMetadata } from "../../lib/types";

/**
 * Main conversation list screen.
 * Shows all conversations with pull-to-refresh and FAB to create new.
 */
export default function ConversationListScreen() {
    const router = useRouter();
    const { conversationsList, setConversationsList, isLoadingConversations, setCurrentConversation } = useStore();
    const [refreshing, setRefreshing] = useState(false);
    const [creating, setCreating] = useState(false);

    // Try to sync with backend on mount (fallback to local if offline)
    const syncWithBackend = async () => {
        try {
            const backendConversations = await getConversations();
            if (backendConversations.length > 0) {
                setConversationsList(backendConversations);
            }
        } catch (error) {
            // Backend unavailable, use local storage
            console.log("Using local storage (backend unavailable)");
        }
    };

    useEffect(() => {
        syncWithBackend();
    }, []);

    // Pull to refresh
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await syncWithBackend();
        setRefreshing(false);
    }, []);

    // Create new conversation
    const handleCreateConversation = async () => {
        setCreating(true);
        try {
            const conversation = await createConversation();
            setCurrentConversation(conversation);
            router.push(`/chat/${conversation.id}`);
        } catch (error) {
            console.error("Failed to create conversation:", error);
            // TODO: Show error toast
        } finally {
            setCreating(false);
        }
    };

    // Open existing conversation
    const handleOpenConversation = async (id: string) => {
        // Try to load from local storage first
        const conversation = await loadConversationFromStorage(id);
        if (conversation) {
            setCurrentConversation(conversation);
        }
        router.push(`/chat/${id}`);
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    // Render a conversation item
    const renderItem = ({ item }: { item: ConversationMetadata }) => (
        <TouchableOpacity
            className="bg-white mx-4 my-2 p-4 rounded-xl border border-gray-100 shadow-sm"
            onPress={() => handleOpenConversation(item.id)}
            activeOpacity={0.7}
        >
            <View className="flex-row justify-between items-start">
                <View className="flex-1 mr-4">
                    <Text className="text-lg font-semibold text-gray-900" numberOfLines={1}>
                        {item.title}
                    </Text>
                    <Text className="text-sm text-gray-500 mt-1">
                        {item.message_count} messages
                    </Text>
                </View>
                <Text className="text-xs text-gray-400">
                    {formatDate(item.created_at)}
                </Text>
            </View>
        </TouchableOpacity>
    );

    // Empty state
    const EmptyState = () => (
        <View className="flex-1 items-center justify-center p-8">
            <Text className="text-6xl mb-4">🎓</Text>
            <Text className="text-xl font-bold text-gray-900 text-center">
                Welcome to LLM Council
            </Text>
            <Text className="text-gray-500 text-center mt-2">
                Ask questions and get answers from a council of AI models
            </Text>
            <TouchableOpacity
                className="mt-6 bg-primary-600 px-6 py-3 rounded-full"
                onPress={handleCreateConversation}
                disabled={creating}
            >
                <Text className="text-white font-semibold">Start your first chat</Text>
            </TouchableOpacity>
        </View>
    );

    if (isLoadingConversations) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50">
                <ActivityIndicator size="large" color="#4f46e5" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            {conversationsList.length === 0 ? (
                <EmptyState />
            ) : (
                <FlatList
                    data={conversationsList}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingVertical: 8 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />
            )}

            {/* FAB for new conversation */}
            {conversationsList.length > 0 && (
                <TouchableOpacity
                    className="absolute bottom-6 right-6 w-14 h-14 bg-primary-600 rounded-full items-center justify-center shadow-lg"
                    onPress={handleCreateConversation}
                    disabled={creating}
                    activeOpacity={0.8}
                >
                    {creating ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text className="text-white text-2xl">+</Text>
                    )}
                </TouchableOpacity>
            )}
        </View>
    );
}
