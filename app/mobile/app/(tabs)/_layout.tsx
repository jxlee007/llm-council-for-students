import { Tabs } from "expo-router";
import TopHeader from "../../components/TopHeader";

/**
 * Tab layout for the main app navigation.
 * Uses a custom TopHeader and hides the bottom tab bar.
 */
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        header: (props) => <TopHeader {...props} />,
        tabBarStyle: { display: "none" }, // Hide bottom tab bar
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
        }}
      />
      <Tabs.Screen
        name="configure"
        options={{
          title: "Council",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
        }}
      />
    </Tabs>
  );
}
