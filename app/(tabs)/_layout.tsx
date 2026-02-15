import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppSettings } from "../../lib/appSettings";
import { t } from "../../lib/i18n";

export default function TabsLayout() {
  const { settings } = useAppSettings();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#06b6d4",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: {
          backgroundColor: "#0b1220",
          borderTopColor: "#1e293b",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t(settings.language, "tab.home"),
          tabBarIcon: ({ color, size }) => <Ionicons name="videocam" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t(settings.language, "tab.settings"),
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
