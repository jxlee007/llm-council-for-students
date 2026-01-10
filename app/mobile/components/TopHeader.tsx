import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  MessageSquare,
  Settings,
  Home,
  ArrowLeft,
  ArrowRight,
  Landmark,
} from "lucide-react-native";
import { useRouter, usePathname } from "expo-router";

/**
 * TopHeader component - Persistent top header navigation.
 * Left: History (💬) → /history
 * Center: Dynamic title
 * Right: Settings (⚙️) → /settings
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function TopHeader(props: any) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();

  // Determine current sub-route
  const isHome =
    pathname === "/" || pathname === "/(tabs)" || pathname === "/(tabs)/";
  const isHistory = pathname.includes("history");
  const isCouncil = pathname.includes("configure");
  const isSettings = pathname.includes("settings");

  // Dynamic Title
  let displayTitle = props.options?.title || "LLM Council";
  if (!props.options?.title) {
    if (isHome) displayTitle = "LLM Council";
    if (isHistory) displayTitle = "Chat History";
    if (isCouncil) displayTitle = "Council";
    if (isSettings) displayTitle = "Settings";
  }

  return (
    <View
      className="flex-row items-center justify-between px-4 mt-5 pb-3 bg-[#0f1419] z-50"
      style={{ paddingTop: insets.top }}
    >
      {/* Left Action - Hidden on History */}
      {isHistory ? (
        <View className="w-14 h-14" />
      ) : (
        <TouchableOpacity
          onPress={() => {
            if (isSettings || isCouncil)
              router.push("/(tabs)"); // Back to home from settings or council
            else if (isHome) router.push("/(tabs)/history");
            else router.push("/(tabs)/settings");
          }}
          className="w-14 h-14 items-center justify-center rounded-full bg-[#1a1f26] border border-[#ffffff1a]"
          accessibilityLabel={
            isSettings || isCouncil
              ? "Back to Home"
              : isHome
                ? "Go to Chat History"
                : "Go to Settings"
          }
        >
          {isSettings || isCouncil ? (
            <ArrowLeft size={20} color="#9ca3af" />
          ) : isHome ? (
            <MessageSquare size={20} color="#9ca3af" />
          ) : (
            <Settings size={20} color="#9ca3af" />
          )}
        </TouchableOpacity>
      )}

      {/* Center: Title */}
      <Text className="text-lg font-bold text-white">{displayTitle}</Text>

      {/* Right Action - Hidden on Settings */}
      {isSettings ? (
        <View className="w-14 h-14" />
      ) : isHistory ? (
        <TouchableOpacity
          onPress={() => router.push("/(tabs)")}
          className="w-14 h-14 items-center justify-center rounded-full bg-[#1a1f26] border border-[#ffffff1a]"
          accessibilityLabel="Back to Home"
        >
          <ArrowRight size={20} color="#9ca3af" />
        </TouchableOpacity>
      ) : isHome ? (
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/configure")}
          className="w-14 h-14 items-center justify-center rounded-full bg-[#1a1f26] border border-[#ffffff1a]"
          accessibilityLabel="Go to Council"
        >
          <Landmark size={20} color="#9ca3af" />
        </TouchableOpacity>
      ) : isCouncil ? (
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/settings")}
          className="w-14 h-14 items-center justify-center rounded-full bg-[#1a1f26] border border-[#ffffff1a]"
          accessibilityLabel="Go to Settings"
        >
          <Settings size={20} color="#9ca3af" />
        </TouchableOpacity>
      ) : (
        // Fallback or other screens (e.g. Chat Detail logic if managed here? currently [id].tsx uses default header or no header?)
        // Assuming [id] might use this header if registered in _layout, but typically [id] is Stack in root?
        // Wait, [id].tsx is a root Stack screen, not in (tabs). So it has its own header usually.
        // This TopHeader is mainly for (tabs) screens.
        <View className="w-14 h-14" />
      )}
    </View>
  );
}
