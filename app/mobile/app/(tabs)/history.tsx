import { useState } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  Pressable,
  Modal,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import {
  MessageSquarePlus,
  MoreVertical,
  FolderPlus,
  Trash2,
} from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";
import EmptyState from "../../components/EmptyState";
import SkeletonLoader from "../../components/SkeletonLoader";
import { Id } from "../../convex/_generated/dataModel";

/**
 * Chat History screen with redesigned list items.
 * Clean layout: no card borders, bottom hairline only, ellipsis menu.
 */
export default function ChatHistoryScreen() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const conversations = useQuery(
    api.conversations.list,
    isSignedIn ? {} : "skip"
  );
  const deleteConversation = useMutation(api.conversations.remove);

  const handleOpenConversation = (id: string) => {
    router.push(`/chat/${id}`);
  };

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

  const openMenu = (id: string, event: any) => {
    event.stopPropagation();
    setSelectedId(id);
    // Get touch position for menu placement
    const { pageX, pageY } = event.nativeEvent;
    setMenuPosition({ x: pageX - 120, y: pageY - 14 });
    setMenuVisible(true);
  };

  const closeMenu = () => {
    setMenuVisible(false);
    setSelectedId(null);
  };

  const handleAddToSets = () => {
    closeMenu();
    // TODO: Implement set selection flow
    Alert.alert("Coming Soon", "Add to Sets feature is coming soon.");
  };

  const handleDelete = () => {
    closeMenu();
    Alert.alert(
      "Delete Conversation",
      "Are you sure you want to delete this conversation? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (selectedId) {
              try {
                await deleteConversation({
                  id: selectedId as Id<"conversations">,
                });
              } catch (err) {
                console.error("Failed to delete:", err);
              }
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      className="px-4 py-3.5 border-b border-border/20"
      style={{ minHeight: 84 }}
      onPress={() => handleOpenConversation(item._id)}
      activeOpacity={0.6}
    >
      {/* Top Row: Title + Ellipsis */}
      <View className="flex-row items-start justify-between">
        <Text
          className="text-base font-medium text-foreground flex-1 mr-3"
          numberOfLines={2}
        >
          {item.title || "Untitled Chat"}
        </Text>
        <TouchableOpacity
          className="w-11 h-11 items-center justify-center -mt-1 -mr-2"
          onPress={(e) => openMenu(item._id, e)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MoreVertical size={18} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Middle Row: AI Council + Mode Badge */}
      <View className="flex-row items-center mt-1.5 gap-2">
        <Text className="text-sm text-muted-foreground">AI Council</Text>
        <View className="bg-primary/15 px-2 py-0.5 rounded-full">
          <Text className="text-xs text-primary font-medium">Debate</Text>
        </View>
      </View>

      {/* Bottom Row: Timestamp */}
      <Text className="text-xs text-muted-foreground/70 mt-1">
        {formatDate(item.lastMessageAt || item._creationTime)}
      </Text>
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
          contentContainerStyle={{ paddingTop: 8 }}
        />
      )}

      {/* Dropdown Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable className="flex-1" onPress={closeMenu}>
          <View
            className="absolute bg-card rounded-xl border border-border overflow-hidden"
            style={{
              top: menuPosition.y,
              left: Math.max(16, Math.min(menuPosition.x, 200)),
              minWidth: 160,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            {/* Add to Sets */}
            <TouchableOpacity
              className="flex-row items-center px-4 py-3"
              onPress={handleAddToSets}
            >
              <FolderPlus size={18} color="#9ca3af" />
              <Text className="text-foreground ml-3 text-sm">Add to Sets</Text>
            </TouchableOpacity>

            <View className="h-px bg-border" />

            {/* Delete */}
            <TouchableOpacity
              className="flex-row items-center px-4 py-3"
              onPress={handleDelete}
            >
              <Trash2 size={18} color="#ef4444" />
              <Text className="text-red-500 ml-3 text-sm">Delete</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
