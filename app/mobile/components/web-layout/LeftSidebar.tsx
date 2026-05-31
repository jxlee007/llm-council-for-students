import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  MessageSquare,
  Plus,
  Star,
  MoreVertical,
  Trash2,
  Sparkles,
  Settings,
  Cpu,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Download,
  MessagesSquare,
} from "lucide-react-native";
import { useChats } from "../../hooks/useChats";
import { useUIStore } from "../../lib/store";
import * as WebBrowser from "expo-web-browser";

// ─── Tooltip wrapper for icon-only collapsed mode ────────────────────────────
function IconBtn({
  icon,
  label,
  onPress,
  active = false,
  collapsed = false,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  active?: boolean;
  collapsed?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      // @ts-ignore
      title={collapsed ? label : undefined}
      className={`flex-row items-center rounded-lg mb-1 transition-all duration-150 border ${
        active
          ? "bg-slate-800/60 border-slate-700/50"
          : "hover:bg-slate-800/40 border-transparent"
      } ${collapsed ? "w-10 h-10 justify-center mx-auto" : "px-3 py-2.5"}`}
    >
      {icon}
      {!collapsed && (
        <Text
          className={`text-sm font-medium ml-3 ${
            active ? "text-white font-semibold" : "text-slate-300"
          }`}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function LeftSidebar() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const activeChatId = params.id;

  const { chats, deleteChat, toggleStarChat, renameChat, isLoading } = useChats();
  const {
    showRightSidebar,
    toggleRightSidebar,
    rightSidebarTab,
    setRightSidebarTab,
    isLeftSidebarOpen,
    toggleLeftSidebar,
    openSearch,
  } = useUIStore();

  const collapsed = !isLeftSidebarOpen;

  const handleToggleTab = (tab: "models" | "settings") => {
    if (showRightSidebar && rightSidebarTab === tab) {
      toggleRightSidebar();
    } else {
      if (!showRightSidebar) toggleRightSidebar();
      setRightSidebarTab(tab);
    }
  };

  // Dropdown menu state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  // Rename inline state
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<TextInput>(null);

  const handleOpenMenu = (chatId: string, event: any) => {
    event.stopPropagation();
    if (activeMenuId === chatId) {
      setActiveMenuId(null);
    } else {
      let x = event.nativeEvent.pageX + 12;
      let y = event.nativeEvent.pageY - 10;
      if (event.currentTarget && typeof event.currentTarget.getBoundingClientRect === "function") {
        const rect = event.currentTarget.getBoundingClientRect();
        x = rect.right + 8;
        y = rect.top;
      }
      setMenuPosition({ x, y });
      setActiveMenuId(chatId);
    }
  };

  const starredChats = chats.filter((c) => c.isStarred);
  const recentChats = chats.filter((c) => !c.isStarred);

  const handleToggleStar = async (chatId: string, event: any) => {
    event.stopPropagation();
    try {
      await toggleStarChat(chatId);
      setActiveMenuId(null);
    } catch (error) {
      console.error("Failed to star chat:", error);
    }
  };

  const handleDeleteChat = async (chatId: string, event: any) => {
    event.stopPropagation();
    try {
      await deleteChat(chatId);
      setActiveMenuId(null);
      if (activeChatId === chatId) router.push("/(tabs)");
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  };

  const handleStartRename = (chat: any) => {
    setActiveMenuId(null);
    setRenamingChatId(chat._id);
    setRenameValue(chat.title || "");
    setTimeout(() => renameInputRef.current?.focus(), 80);
  };

  const handleCommitRename = async (chatId: string) => {
    const trimmed = renameValue.trim();
    if (trimmed && renameChat) {
      try { await renameChat(chatId, trimmed); } catch (err) { console.error("Rename failed:", err); }
    }
    setRenamingChatId(null);
    setRenameValue("");
  };

  const renderChatRow = (chat: any) => {
    const isActive = activeChatId === chat._id;
    const isMenuOpen = activeMenuId === chat._id;
    const isRenaming = renamingChatId === chat._id;

    return (
      <View key={chat._id} className="relative z-10">
        <TouchableOpacity
          onPress={() => { if (!isRenaming) router.push(`/chat/${chat._id}`); }}
          className={`group flex-row items-center justify-between px-3 py-2.5 rounded-lg mb-1 transition-all duration-150 ${
            isActive ? "bg-[#1e293b]" : "hover:bg-slate-800/40"
          }`}
          activeOpacity={0.7}
        >
          <View className="flex-row items-center flex-1 mr-2">
            <MessageSquare size={18} color={isActive ? "#20c997" : "#94a3b8"} className="mr-3" />
            {isRenaming ? (
              <TextInput
                ref={renameInputRef}
                value={renameValue}
                onChangeText={setRenameValue}
                onBlur={() => handleCommitRename(chat._id)}
                onSubmitEditing={() => handleCommitRename(chat._id)}
                style={{
                  flex: 1, color: "#f1f5f9", fontSize: 14, fontWeight: "500",
                  backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 6,
                  paddingHorizontal: 6, paddingVertical: 2,
                  // @ts-ignore
                  outlineStyle: "none",
                }}
              />
            ) : (
              <Text
                className={`text-sm font-medium truncate ${isActive ? "text-white" : "text-slate-300"}`}
                numberOfLines={1}
              >
                {chat.title || "Untitled Chat"}
              </Text>
            )}
          </View>
          {!isRenaming && (
            <TouchableOpacity
              onPress={(e) => handleOpenMenu(chat._id, e)}
              className={`w-7 h-7 items-center justify-center rounded-md hover:bg-slate-700/50 ${
                isMenuOpen ? "flex bg-slate-700/40" : "group-hover:flex hidden"
              }`}
            >
              <MoreVertical size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // ─── COLLAPSED: icon-only rail ────────────────────────────────────────────
  if (collapsed) {
    return (
      <View
        className="flex-1 bg-[#0f1419] flex-col items-center py-4"
        style={{ overflow: "visible" }}
      >
        {/* Top group: expand + new chat + search + models + settings */}
        <View className="flex-col items-center gap-1 w-full">
          {/* Expand */}
          <TouchableOpacity
            onPress={toggleLeftSidebar}
            activeOpacity={0.7}
            className="w-10 h-10 items-center justify-center rounded-lg mb-1 hover:bg-slate-800/40 transition-colors"
            // @ts-ignore
            title="Expand sidebar"
          >
            <PanelLeftOpen size={18} color="#64748b" />
          </TouchableOpacity>

          {/* Search */}
          <TouchableOpacity
            onPress={openSearch}
            activeOpacity={0.7}
            className="w-10 h-10 items-center justify-center rounded-lg mb-1 hover:bg-slate-800/40 transition-colors"
            // @ts-ignore
            title="Search chats"
          >
            <Search size={18} color="#64748b" />
          </TouchableOpacity>

          {/* New Chat */}
          <TouchableOpacity
            onPress={() => router.push("/(tabs)")}
            activeOpacity={0.7}
            className="w-10 h-10 items-center justify-center rounded-lg mb-1 hover:bg-slate-800/40 transition-colors"
            // @ts-ignore
            title="New Chat"
          >
            <Plus size={18} color="#20c997" strokeWidth={2.5} />
          </TouchableOpacity>

          {/* Chats / History */}
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/history")}
            activeOpacity={0.7}
            className="w-10 h-10 items-center justify-center rounded-lg mb-1 hover:bg-slate-800/40 transition-colors"
            // @ts-ignore
            title="Chats"
          >
            <MessagesSquare size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Spacer */}
        <View className="flex-1" />

        {/* Bottom: Download App */}
        <TouchableOpacity
          activeOpacity={0.7}
          className="w-10 h-10 items-center justify-center rounded-lg hover:bg-slate-800/40 transition-colors"
          // @ts-ignore
          title="Download App"
          onPress={() => WebBrowser.openBrowserAsync("https://github.com/jxlee007/llm-council-for-students/releases/download/dev/app-v8.apk")}
        >
          <Download size={18} color="#64748b" />
        </TouchableOpacity>
      </View>
    );
  }

  // ─── EXPANDED: full sidebar ───────────────────────────────────────────────
  return (
    <View className="flex-1 bg-[#0f1419] flex-col justify-between border-r border-slate-800/80" style={{ overflow: "visible" }}>
      {/* Upper container */}
      <View className="flex-1 flex-col p-4">

        {/* Branding header — LLM COUNCIL + 🔍 + collapse */}
        <View className="flex-row items-center justify-between mb-6 px-1">
          <View className="flex-row items-center">
            <Sparkles size={20} color="#20c997" className="mr-2.5" />
            <Text className="text-lg font-bold text-white tracking-wide">LLM COUNCIL</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <TouchableOpacity
              onPress={openSearch}
              className="w-8 h-8 items-center justify-center rounded-md hover:bg-slate-800/60 transition-colors"
              activeOpacity={0.7}
            >
              <Search size={16} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={toggleLeftSidebar}
              className="w-8 h-8 items-center justify-center rounded-md hover:bg-slate-800/60 transition-colors"
              activeOpacity={0.7}
            >
              <PanelLeftClose size={16} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        {/* New Chat */}
        <TouchableOpacity
          onPress={() => router.push("/(tabs)")}
          className="flex-row items-center px-3 py-2.5 rounded-lg mb-1 hover:bg-slate-800/40 transition-all duration-150"
          activeOpacity={0.7}
        >
          <Plus size={18} color="#20c997" strokeWidth={2.5} className="mr-3" />
          <Text className="text-sm font-medium text-slate-200">New Chat</Text>
        </TouchableOpacity>

        {/* Chats (history nav) */}
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/history")}
          className="flex-row items-center px-3 py-2.5 rounded-lg mb-1 hover:bg-slate-800/40 transition-all duration-150"
          activeOpacity={0.7}
        >
          <MessagesSquare size={18} color="#94a3b8" strokeWidth={2} className="mr-3" />
          <Text className="text-sm font-medium text-slate-300">Chats</Text>
        </TouchableOpacity>

        {/* Available Free Models */}
        <TouchableOpacity
          onPress={() => handleToggleTab("models")}
          className={`flex-row items-center px-3 py-2.5 rounded-lg mb-1 transition-all duration-150 border ${
            showRightSidebar && rightSidebarTab === "models"
              ? "bg-slate-800/60 border-slate-700/50"
              : "hover:bg-slate-800/40 border-transparent"
          }`}
          activeOpacity={0.7}
        >
          <Cpu
            size={18}
            color={showRightSidebar && rightSidebarTab === "models" ? "#20c997" : "#94a3b8"}
            strokeWidth={2.2}
            className="mr-3"
          />
          <Text className={`text-sm font-medium ${showRightSidebar && rightSidebarTab === "models" ? "text-white font-semibold" : "text-slate-300"}`}>
            Available Free Models
          </Text>
        </TouchableOpacity>

        {/* Settings */}
        <TouchableOpacity
          onPress={() => handleToggleTab("settings")}
          className={`flex-row items-center px-3 py-2.5 rounded-lg mb-5 transition-all duration-150 border ${
            showRightSidebar && rightSidebarTab === "settings"
              ? "bg-slate-800/60 border-slate-700/50"
              : "hover:bg-slate-800/40 border-transparent"
          }`}
          activeOpacity={0.7}
        >
          <Settings
            size={18}
            color={showRightSidebar && rightSidebarTab === "settings" ? "#20c997" : "#94a3b8"}
            strokeWidth={2.2}
            className="mr-3"
          />
          <Text className={`text-sm font-medium ${showRightSidebar && rightSidebarTab === "settings" ? "text-white font-semibold" : "text-slate-300"}`}>
            Settings
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        <View className="h-px bg-slate-800/60 mb-4" />

        {/* Scrollable Chat list */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="small" color="#20c997" />
          </View>
        ) : chats.length === 0 ? (
          <View className="flex-1 items-center justify-center px-4 py-8">
            <Text className="text-slate-500 text-xs text-center font-medium leading-4">
              Your conversations will appear here.
            </Text>
          </View>
        ) : (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {starredChats.length > 0 && (
              <View className="mb-5">
                <Text className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">
                  Starred
                </Text>
                {starredChats.map(renderChatRow)}
              </View>
            )}
            {recentChats.length > 0 && (
              <View className="mb-5">
                <Text className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">
                  Recents
                </Text>
                {recentChats.map(renderChatRow)}
              </View>
            )}
          </ScrollView>
        )}
      </View>

      {/* Footer — Download App only */}
      <View className="p-4 border-t border-slate-800/60">
        <TouchableOpacity
          className="flex-row items-center px-3 py-2.5 rounded-lg hover:bg-slate-800/40 transition-all duration-150"
          activeOpacity={0.7}
          onPress={() => WebBrowser.openBrowserAsync("https://github.com/jxlee007/llm-council-for-students/releases/download/dev/app-v8.apk")}
        >
          <Download size={18} color="#64748b" strokeWidth={2} className="mr-3" />
          <Text className="text-sm font-medium text-slate-400">Download App</Text>
        </TouchableOpacity>
      </View>

      {/* Viewport-level Context Menu Dropdown */}
      {(() => {
        if (!activeMenuId) return null;
        const activeChat = chats.find((c) => c._id === activeMenuId);
        if (!activeChat) return null;
        return (
          <>
            <Pressable
              className="absolute inset-0 z-20"
              style={{ position: "fixed" as any }}
              onPress={() => setActiveMenuId(null)}
            />
            <View
              className="absolute bg-slate-900 border border-slate-700 rounded-lg py-1 shadow-xl z-30 w-40"
              style={{
                position: "fixed" as any,
                top: menuPosition.y,
                left: menuPosition.x,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
              }}
            >
              <TouchableOpacity
                onPress={() => handleStartRename(activeChat)}
                className="flex-row items-center px-3 py-2 hover:bg-slate-800"
              >
                <Pencil size={14} color="#94a3b8" className="mr-2.5" />
                <Text className="text-slate-200 text-xs font-medium">Rename</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={(e) => handleToggleStar(activeChat._id, e)}
                className="flex-row items-center px-3 py-2 hover:bg-slate-800"
              >
                <Star
                  size={14}
                  color={activeChat.isStarred ? "#fbbf24" : "#94a3b8"}
                  fill={activeChat.isStarred ? "#fbbf24" : "none"}
                  className="mr-2.5"
                />
                <Text className="text-slate-200 text-xs font-medium">
                  {activeChat.isStarred ? "Unstar" : "Star"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={(e) => handleDeleteChat(activeChat._id, e)}
                className="flex-row items-center px-3 py-2 hover:bg-slate-800"
              >
                <Trash2 size={14} color="#ef4444" className="mr-2.5" />
                <Text className="text-red-400 text-xs font-medium">Delete</Text>
              </TouchableOpacity>
            </View>
          </>
        );
      })()}
    </View>
  );
}
