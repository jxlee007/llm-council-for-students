import { useState, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Plus, MessageSquareQuote } from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useStore } from "../../lib/store";

/**
 * Main conversation list screen.
 * Shows all conversations from Convex with real-time updates.
 */
export default function ConversationListScreen() {
    const router = useRouter();
    const conversations = useQuery(api.conversations.list);
    const createConversation = useMutation(api.conversations.create);
    
    const [creating, setCreating] = useState(false);

    // Create new conversation
    const handleCreateConversation = async () => {
        setCreating(true);
        try {
            const conversationId = await createConversation({
                title: "New Chat",
            });
            // router.push(`/chat/${conversationId}`);
            // Note: In Convex, conversationId is a string but with a specific format
            router.push(`/chat/${conversationId}`);
        } catch (error) {
            console.error("Failed to create conversation:", error);
        } finally {
            setCreating(false);
        }
    };

    // Open existing conversation
    const handleOpenConversation = (id: string) => {
        router.push(`/chat/${id}`);
    };

    // Format date for display
    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    // Render a conversation item
    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            className="bg-white mx-4 my-2 p-4 rounded-xl border border-gray-100 shadow-sm"
            onPress={() => handleOpenConversation(item._id)}
            activeOpacity={0.7}
        >
            <View className="flex-row justify-between items-start">
                <View className="flex-1 mr-4">
                    <Text className="text-lg font-semibold text-gray-900" numberOfLines={1}>
                        {item.title}
                    </Text>
                    <Text className="text-sm text-gray-500 mt-1">
                        AI Council
                    </Text>
                </View>
                <Text className="text-xs text-gray-400">
                    {formatDate(item.lastMessageAt)}
                </Text>
            </View>
        </TouchableOpacity>
    );

    // Empty state
    const EmptyState = () => (
        <View className="flex-1 items-center justify-center p-8">
            <MessageSquareQuote size={64} color="#4f46e5" />
            <Text className="text-xl font-bold text-gray-900 text-center mt-4">
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

    if (conversations === undefined) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50">
                <ActivityIndicator size="large" color="#4f46e5" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            {conversations.length === 0 ? (
                <EmptyState />
            ) : (
                <FlatList
                    data={conversations}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingVertical: 8 }}
                />
            )}

            {/* FAB for new conversation */}
            {conversations.length > 0 && (
                <TouchableOpacity
                    className="absolute bottom-6 right-6 w-14 h-14 bg-primary-600 rounded-full items-center justify-center shadow-lg"
                    onPress={handleCreateConversation}
                    disabled={creating}
                    activeOpacity={0.8}
                >
                    {creating ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Plus color="#fff" size={24} />
                    )}
                </TouchableOpacity>
            )}
        </View>
    );
}

