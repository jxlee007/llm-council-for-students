import { useState } from "react";
import {
    View,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Text,
} from "react-native";
import { useRouter } from "expo-router";
import { Plus, MessageSquarePlus } from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";
import EmptyState from "../../components/EmptyState";
import SkeletonLoader from "../../components/SkeletonLoader";

/**
 * Main conversation list screen.
 * Shows all conversations from Convex with real-time updates.
 */
export default function ConversationListScreen() {
    const router = useRouter();
    const { isSignedIn } = useAuth();
    
    // Only run queries if signed in
    const conversations = useQuery(
        api.conversations.list,
        isSignedIn ? {} : "skip"
    );
    const createConversation = useMutation(api.conversations.create);
    
    const [creating, setCreating] = useState(false);

    // Create new conversation
    const handleCreateConversation = async () => {
        if (!isSignedIn) {
            router.push("/(auth)");
            return;
        }
        
        setCreating(true);
        try {
            const conversationId = await createConversation({
                title: "New Chat",
            });
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
            className="bg-card mx-4 my-2 p-4 rounded-xl border border-border shadow-sm"
            onPress={() => handleOpenConversation(item._id)}
            activeOpacity={0.7}
        >
            <View className="flex-row justify-between items-start">
                <View className="flex-1 mr-4">
                    <Text className="text-lg font-semibold text-foreground" numberOfLines={1}>
                        {item.title}
                    </Text>
                    <Text className="text-sm text-muted-foreground mt-1">
                        AI Council
                    </Text>
                </View>
                <Text className="text-xs text-muted-foreground font-medium">
                    {formatDate(item.lastMessageAt)}
                </Text>
            </View>
        </TouchableOpacity>
    );

    // Loading state
    if (conversations === undefined) {
        return <SkeletonLoader />;
    }

    return (
        <View className="flex-1 bg-background">
            {conversations.length === 0 ? (
                <EmptyState 
                    icon={MessageSquarePlus}
                    title="No conversations yet"
                    description="Start your first chat with the AI Council of experts."
                    actionLabel="New Chat"
                    onAction={handleCreateConversation}
                    loading={creating}
                />
            ) : (
                <>
                    <FlatList
                        data={conversations}
                        keyExtractor={(item) => item._id}
                        renderItem={renderItem}
                        contentContainerStyle={{ paddingVertical: 8 }}
                    />

                    {/* FAB for new conversation */}
                    <TouchableOpacity
                        className="absolute bottom-6 right-6 w-16 h-16 bg-primary rounded-full items-center justify-center shadow-lg"
                        onPress={handleCreateConversation}
                        disabled={creating}
                        activeOpacity={0.8}
                    >
                        {creating ? (
                            <ActivityIndicator size="small" color="#0f1419" />
                        ) : (
                            <Plus color="#0f1419" size={28} />
                        )}
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
}
