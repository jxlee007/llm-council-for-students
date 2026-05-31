import { useState, useMemo } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import {
  MessageSquarePlus,
  Search,
  CheckSquare,
  Square,
  Trash2,
  ChevronRight,
} from "lucide-react-native";
import { useChats } from "../../hooks/useChats";
import EmptyState from "../../components/EmptyState";
import SkeletonLoader from "../../components/SkeletonLoader";

/**
 * Chat History screen with redesigned, premium, multi-select list items.
 * Renders horizontally structured items (Title, Timestamp, Query preview) matching Claude/ChatGPT layouts.
 */
export default function ChatHistoryScreen() {
  const router = useRouter();
  const { chats: conversations, deleteChat: deleteConversation, isLoading } = useChats();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedChatIds, setSelectedChatIds] = useState<Set<string>>(new Set());

  const handleOpenConversation = (id: string) => {
    if (isSelectMode) {
      toggleSelectChat(id);
    } else {
      router.push(`/chat/${id}`);
    }
  };

  const toggleSelectChat = (id: string) => {
    setSelectedChatIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedChatIds.size === filteredChats.length) {
      // Deselect all
      setSelectedChatIds(new Set());
    } else {
      // Select all filtered
      const next = new Set<string>();
      filteredChats.forEach((c) => next.add(c._id));
      setSelectedChatIds(next);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedChatIds.size === 0) return;

    Alert.alert(
      "Delete Chats",
      `Are you sure you want to delete the ${selectedChatIds.size} selected chat(s)? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const idsArray = Array.from(selectedChatIds);
              for (const id of idsArray) {
                await deleteConversation(id);
              }
              setSelectedChatIds(new Set());
              setIsSelectMode(false);
            } catch (err) {
              console.error("Failed to delete chats:", err);
              Alert.alert("Error", "Failed to delete some conversations.");
            }
          },
        },
      ]
    );
  };

  const handleCancelSelection = () => {
    setSelectedChatIds(new Set());
    setIsSelectMode(false);
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return "last month";
  };

  // Filter conversations based on title and query
  const filteredChats = useMemo(() => {
    if (!conversations) return [];
    return conversations.filter((c) => {
      const title = (c.title || "").toLowerCase();
      const firstQuery = (c.firstQuery || "").toLowerCase();
      const query = searchQuery.toLowerCase();
      return title.includes(query) || firstQuery.includes(query);
    });
  }, [conversations, searchQuery]);

  const renderItem = ({ item }: { item: any }) => {
    const itemId = item._id;
    const isSelected = selectedChatIds.has(itemId);

    return (
      <TouchableOpacity
        style={[
          styles.itemRow,
          isSelected && styles.itemRowSelected
        ]}
        onPress={() => handleOpenConversation(itemId)}
        activeOpacity={0.7}
      >
        {/* Checkbox (visible in select mode) */}
        {isSelectMode && (
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => toggleSelectChat(itemId)}
          >
            {isSelected ? (
              <CheckSquare size={18} color="#20c997" />
            ) : (
              <Square size={18} color="#404040" />
            )}
          </TouchableOpacity>
        )}

        {/* Content Container (Title on left, Time + Count on right) */}
        <View style={styles.itemContent}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {item.title || "Untitled Chat"}
          </Text>

          <View style={styles.itemMeta}>
            <Text style={styles.itemTimestamp}>
              {formatDate(item.lastMessageAt || item._creationTime)}
              {item.userQueriesCount !== undefined ? ` • ${item.userQueriesCount} ${item.userQueriesCount === 1 ? 'query' : 'queries'}` : ""}
            </Text>
          </View>
        </View>

        {/* Chevron Right (hidden in select mode) */}
        {!isSelectMode && (
          <ChevronRight size={16} color="#404040" style={styles.chevron} />
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return <SkeletonLoader />;
  }

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Chats</Text>

        {!isSelectMode ? (
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionBtnOutline}
              onPress={() => setIsSelectMode(true)}
            >
              <Text style={styles.actionBtnOutlineText}>Select chats</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnSolid}
              onPress={() => router.push("/")}
            >
              <Text style={styles.actionBtnSolidText}>New chat</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.headerActions}>
            <Text style={styles.selectedCountText}>
              {selectedChatIds.size} selected
            </Text>

            <TouchableOpacity
              style={styles.actionBtnOutline}
              onPress={handleSelectAll}
            >
              <Text style={styles.actionBtnOutlineText}>
                {selectedChatIds.size === filteredChats.length
                  ? "Deselect all"
                  : "Select all"}
              </Text>
            </TouchableOpacity>



            <TouchableOpacity
              style={[
                styles.actionBtnSolid,
                { backgroundColor: "#7f1d1d" },
                selectedChatIds.size === 0 && { opacity: 0.5 }
              ]}
              disabled={selectedChatIds.size === 0}
              onPress={handleDeleteSelected}
            >
              <Trash2 size={14} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnSolidText}>Delete</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnText}
              onPress={handleCancelSelection}
            >
              <Text style={styles.actionBtnTextLabel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBarContainer}>
        <Search size={16} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search chats..."
          placeholderTextColor="#6b7280"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Chats FlatList */}
      {filteredChats.length === 0 ? (
        <EmptyState
          icon={MessageSquarePlus}
          title={searchQuery ? "No matching chats" : "No conversations yet"}
          description={
            searchQuery
              ? "Try adjusting your search query."
              : "Start a new chat from the home screen to see your history here."
          }
        />
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f1419",
    paddingHorizontal: 40,
    paddingTop: 40,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectedCountText: {
    fontSize: 14,
    color: "#9ca3af",
    marginRight: 8,
  },
  actionBtnOutline: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#1e1e1e",
    borderWidth: 1,
    borderColor: "#404040",
  },
  actionBtnOutlineText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "500",
  },
  actionBtnSolid: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#20c997",
  },
  actionBtnSolidText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  actionBtnText: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  actionBtnTextLabel: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "600",
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    borderWidth: 1,
    borderColor: "#262626",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 24,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 14,
    padding: 0,
    ...Platform.select({
      web: {
        outlineStyle: "none",
      } as any,
      default: {},
    }),
  },
  listContent: {
    paddingBottom: 24,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#1e1e1e",
  },
  itemRowSelected: {
    backgroundColor: "rgba(32, 201, 151, 0.04)",
  },
  checkboxContainer: {
    marginRight: 12,
    padding: 4,
  },
  itemContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
    flex: 1,
    marginRight: 16,
  },
  itemMeta: {
    alignItems: "flex-end",
  },
  itemTimestamp: {
    fontSize: 13,
    color: "#9ca3af",
  },
  chevron: {
    marginLeft: 8,
  },
});
