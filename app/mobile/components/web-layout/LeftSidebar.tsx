import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Pressable,
  ActivityIndicator,
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
} from "lucide-react-native";
import { useChats } from "../../hooks/useChats";
import { useUIStore } from "../../lib/store";

export default function LeftSidebar() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const activeChatId = params.id;

  const { chats, createChat, deleteChat, toggleStarChat, isLoading } = useChats();
  const { showRightSidebar, toggleRightSidebar, rightSidebarTab, setRightSidebarTab } = useUIStore();

  const handleToggleTab = (tab: "models" | "settings") => {
    if (showRightSidebar && rightSidebarTab === tab) {
      toggleRightSidebar();
    } else {
      if (!showRightSidebar) {
        toggleRightSidebar();
      }
      setRightSidebarTab(tab);
    }
  };

  // Dropdown menu state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

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

  // Group chats into Starred and Recents
  const starredChats = chats.filter((c) => c.isStarred);
  const recentChats = chats.filter((c) => !c.isStarred);

  const handleNewChat = () => {
    router.push("/(tabs)");
  };

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
      if (activeChatId === chatId) {
        router.push("/(tabs)/history");
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  };

  const renderChatRow = (chat: any) => {
    const isActive = activeChatId === chat._id;
    const isMenuOpen = activeMenuId === chat._id;

    return (
      <View key={chat._id} className="relative z-10">
        <TouchableOpacity
          onPress={() => router.push(`/chat/${chat._id}`)}
          className={`group flex-row items-center justify-between px-3 py-2.5 rounded-lg mb-1 transition-all duration-150 ${
            isActive ? "bg-[#1e293b]" : "hover:bg-slate-800/40"
          }`}
          activeOpacity={0.7}
        >
          <View className="flex-row items-center flex-1 mr-2">
            <MessageSquare
              size={18}
              color={isActive ? "#20c997" : "#94a3b8"}
              className="mr-3"
            />
            <Text
              className={`text-sm font-medium truncate ${
                isActive ? "text-white" : "text-slate-300"
              }`}
              numberOfLines={1}
            >
              {chat.title || "Untitled Chat"}
            </Text>
          </View>

          {/* Vertical ellipsis icon container - ONLY visible on hover */}
          <TouchableOpacity
            onPress={(e) => handleOpenMenu(chat._id, e)}
            className={`w-7 h-7 items-center justify-center rounded-md hover:bg-slate-700/50 ${
              isMenuOpen ? "flex bg-slate-700/40" : "group-hover:flex hidden"
            }`}
          >
            <MoreVertical size={16} color="#94a3b8" />
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#0f1419] flex-col justify-between border-r border-slate-800/80" style={{ overflow: "visible" }}>
      {/* Upper container */}
      <View className="flex-1 flex-col p-4">
        {/* Branding header */}
        <View className="flex-row items-center mb-6 px-1">
          <Sparkles size={20} color="#20c997" className="mr-2.5" />
          <Text className="text-lg font-bold text-white tracking-wide">
            LLM COUNCIL
          </Text>
        </View>

        {/* New Chat List Option */}
        <TouchableOpacity
          onPress={handleNewChat}
          className="flex-row items-center px-3 py-2.5 rounded-lg mb-3 hover:bg-slate-800/40 transition-all duration-150"
          activeOpacity={0.7}
        >
          <Plus
            size={18}
            color="#20c997"
            strokeWidth={2.5}
            className="mr-3"
          />
          <Text className="text-sm font-medium text-slate-200">
            New Chat
          </Text>
        </TouchableOpacity>

        {/* Active Council (Models) List Option */}
        <TouchableOpacity
          onPress={() => handleToggleTab("models")}
          className={`flex-row items-center px-3 py-2.5 rounded-lg mb-3 transition-all duration-150 border ${
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
          <Text
            className={`text-sm font-medium ${
              showRightSidebar && rightSidebarTab === "models" ? "text-white font-semibold" : "text-slate-300"
            }`}
          >
            Available Free Models
          </Text>
        </TouchableOpacity>

        {/* Settings List Option */}
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
          <Text
            className={`text-sm font-medium ${
              showRightSidebar && rightSidebarTab === "settings" ? "text-white font-semibold" : "text-slate-300"
            }`}
          >
            Settings
          </Text>
        </TouchableOpacity>

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
            {/* Starred section */}
            {starredChats.length > 0 && (
              <View className="mb-5">
                <Text className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">
                  Starred
                </Text>
                {starredChats.map(renderChatRow)}
              </View>
            )}

            {/* Recents section */}
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

      {/* Footer / User Profile section (Purely aesthetic, fits the mockup) */}
      <View className="p-4 border-t border-slate-800/60 bg-slate-900/20 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 items-center justify-center mr-2.5">
            <Text className="text-emerald-400 font-bold text-xs">G</Text>
          </View>
          <View>
            <Text className="text-white text-xs font-semibold">Web Guest</Text>
            <Text className="text-slate-500 text-[10px]">Playground Mode</Text>
          </View>
        </View>
      </View>

      {/* Viewport-level Context Menu Dropdown (escapes ScrollView boundaries) */}
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
              className="absolute bg-slate-900 border border-slate-700 rounded-lg py-1 shadow-xl z-30 w-36"
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
              {/* Star / Unstar Option */}
              <TouchableOpacity
                onPress={(e) => handleToggleStar(activeChat._id, e)}
                className="flex-row items-center px-3 py-2 hover:bg-slate-800 active:bg-slate-800"
              >
                <Star
                  size={14}
                  color={activeChat.isStarred ? "#fbbf24" : "#94a3b8"}
                  fill={activeChat.isStarred ? "#fbbf24" : "none"}
                  className="mr-2.5"
                />
                <Text className="text-slate-200 text-xs font-medium">
                  {activeChat.isStarred ? "Unstar Chat" : "Star Chat"}
                </Text>
              </TouchableOpacity>

              {/* Delete Option */}
              <TouchableOpacity
                onPress={(e) => handleDeleteChat(activeChat._id, e)}
                className="flex-row items-center px-3 py-2 hover:bg-slate-800 active:bg-slate-800"
              >
                <Trash2 size={14} color="#ef4444" className="mr-2.5" />
                <Text className="text-red-400 text-xs font-medium">
                  Delete Chat
                </Text>
              </TouchableOpacity>
            </View>
          </>
        );
      })()}
    </View>
  );
}
