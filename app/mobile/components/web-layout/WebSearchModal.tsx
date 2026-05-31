import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Search, X, MessageSquare } from "lucide-react-native";
import { useUIStore } from "../../lib/store";
import { useChats } from "../../hooks/useChats";

/** Returns a human-friendly relative time string from a timestamp. */
function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (weeks === 1) return "Last week";
  if (weeks < 4) return `${weeks} weeks ago`;
  if (months === 1) return "Last month";
  if (months < 12) return `${months} months ago`;
  return "Over a year ago";
}

/**
 * WebSearchModal — Global search overlay for web.
 * Triggered by the 🔍 icon in the sidebar or Cmd/Ctrl+K.
 * Renders as a centered floating modal over a dark backdrop.
 */
export default function WebSearchModal() {
  const isOpen = useUIStore((state) => state.isSearchOpen);
  const closeSearch = useUIStore((state) => state.closeSearch);
  const router = useRouter();
  const { chats } = useChats();

  const [query, setQuery] = useState("");
  const inputRef = useRef<TextInput>(null);

  // Filter chats by search query
  const filtered = query.trim()
    ? chats.filter((c: any) =>
        c.title?.toLowerCase().includes(query.trim().toLowerCase())
      )
    : chats;

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // Global Cmd/Ctrl+K keyboard shortcut (web only)
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const openSearch = useUIStore.getState().openSearch;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openSearch();
      }
      if (e.key === "Escape" && isOpen) {
        closeSearch();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeSearch]);

  const handleSelect = useCallback(
    (chatId: string) => {
      closeSearch();
      router.push(`/chat/${chatId}`);
    },
    [closeSearch, router]
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <Pressable
        onPress={closeSearch}
        style={{
          position: "fixed" as any,
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.55)",
          zIndex: 1000,
        }}
      />

      {/* Modal Panel */}
      <View
        style={{
          position: "fixed" as any,
          top: "18%",
          left: "50%",
          transform: [{ translateX: "-50%" as any }],
          width: "100%",
          maxWidth: 560,
          zIndex: 1001,
          backgroundColor: "#111827",
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 24 },
          shadowOpacity: 0.5,
          shadowRadius: 40,
          overflow: "hidden",
        }}
      >
        {/* Search Input Row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: filtered.length > 0 ? 1 : 0,
            borderBottomColor: "rgba(255,255,255,0.06)",
          }}
        >
          <Search size={18} color="#64748b" />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Search chats…"
            placeholderTextColor="#4b5563"
            onKeyPress={(e) => {
              if (e.nativeEvent.key === "Escape") {
                closeSearch();
              }
            }}
            style={{
              flex: 1,
              color: "#f1f5f9",
              fontSize: 16,
              marginLeft: 12,
              marginRight: 8,
              // @ts-ignore — web only
              outlineStyle: "none",
            }}
          />
          {/* Keyboard hint */}
          <View
            style={{
              flexDirection: "row",
              gap: 4,
              alignItems: "center",
              marginRight: 10,
            }}
          >
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.07)",
                borderRadius: 4,
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}
            >
              <Text style={{ color: "#6b7280", fontSize: 11 }}>ESC</Text>
            </View>
          </View>
          <TouchableOpacity onPress={closeSearch} activeOpacity={0.7}>
            <X size={18} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Results list */}
        <ScrollView
          style={{ maxHeight: 360 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {filtered.length === 0 ? (
            <View style={{ paddingVertical: 32, alignItems: "center" }}>
              <Text style={{ color: "#4b5563", fontSize: 14 }}>
                {query.trim() ? "No chats match your search." : "No conversations yet."}
              </Text>
            </View>
          ) : (
            filtered.map((chat: any) => (
              <TouchableOpacity
                key={chat._id}
                onPress={() => handleSelect(chat._id)}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: "rgba(255,255,255,0.04)",
                }}
                // @ts-ignore
                className="hover:bg-slate-800/40 transition-colors duration-100"
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: "rgba(32,201,151,0.1)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                    flexShrink: 0,
                  }}
                >
                  <MessageSquare size={15} color="#20c997" />
                </View>
                <Text
                  numberOfLines={1}
                  style={{ flex: 1, color: "#e2e8f0", fontSize: 14, fontWeight: "500" }}
                >
                  {chat.title || "Untitled Chat"}
                </Text>
                <Text
                  style={{
                    color: "#4b5563",
                    fontSize: 11,
                    marginLeft: 12,
                    flexShrink: 0,
                  }}
                >
                  {formatRelativeTime(chat.lastMessageAt || chat._creationTime || 0)}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* Footer hint */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderTopWidth: 1,
            borderTopColor: "rgba(255,255,255,0.05)",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#374151", fontSize: 11 }}>
            Press{" "}
            <Text style={{ color: "#4b5563", fontWeight: "600" }}>⌘K</Text>
            {" "}or{" "}
            <Text style={{ color: "#4b5563", fontWeight: "600" }}>Ctrl+K</Text>
            {" "}to search anytime
          </Text>
        </View>
      </View>
    </>
  );
}
