import { IconSymbol } from "@/components/IconSymbol";
import { Tabs } from "expo-router";
import { Platform } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="(home)/index"
      screenOptions={{
        tabBarActiveTintColor: "white",
        tabBarInactiveTintColor: "#ccc",
        // tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarStyle: {
          paddingTop: 8,
          backgroundColor: "#000",
          position: "absolute",
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: "journal",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={28}
              name={focused ? "newspaper.fill" : "newspaper"}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="(people)"
        options={{
          title: "people",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={28}
              name={focused ? "person.2.fill" : "person.2"}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "settings",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={28}
              name={focused ? "gearshape.fill" : "gearshape"}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
