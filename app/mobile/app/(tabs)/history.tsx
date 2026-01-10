import { View, FlatList, TouchableOpacity, Text } from "react-native";
import { useRouter } from "expo-router";
import { MessageSquarePlus } from "lucide-react-native";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";
import EmptyState from "../../components/EmptyState";
import SkeletonLoader from "../../components/SkeletonLoader";

/**
 * Chat History screen.
 * Shows all past conversations with empty state.
 */
export default function ChatHistoryScreen() {
  const router = useRouter();
  const { isSignedIn } = useAuth();

  const conversations = useQuery(
    api.conversations.list,
    isSignedIn ? {} : "skip"
  );

  // Open existing conversation
  const handleOpenConversation = (id: string) => {
    router.push(`/chat/${id}`);
  };

  // Format date for display
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Render a conversation item
  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      className="bg-card mx-4 my-2 p-4 rounded-xl border border-border"
      style={{
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.18,
        shadowRadius: 1.0,
      }}
      onPress={() => handleOpenConversation(item._id)}
      activeOpacity={0.7}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1 mr-4">
          <Text
            className="text-lg font-semibold text-foreground"
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text className="text-sm text-muted-foreground mt-1">AI Council</Text>
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
          description="Start a new chat from the home screen to see your history here."
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 8 }}
        />
      )}
    </View>
  );
}
