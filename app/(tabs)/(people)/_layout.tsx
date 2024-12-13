import { useStore } from "@/app/store";
import CustomHeader from "@/components/CustomHeader";
import { IconSymbol } from "@/components/IconSymbol";
import { useRoute } from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import React from "react";
import {
  Button,
  Text,
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from "react-native";

export default function Layout() {
  const router = useRouter();

  return (
    <View
      style={{
        backgroundColor: "white",
        flex: 1,
      }}
    >
      <Stack
        screenOptions={{
          headerTitle: (props) => (
            <CustomHeader
              title={props.children}
              color={props.tintColor}
              button={() => (
                <TouchableOpacity
                  onPress={() => {
                    router.navigate(`/(people)/create`);
                  }}
                  style={{ paddingRight: 24 }} // Add padding
                >
                  <IconSymbol size={28} name={"plus.circle"} color="black" />
                </TouchableOpacity>
              )}
            />
          ),
          headerBackTitleVisible: false,
          headerTitleAlign: "left",
          headerTitleStyle: {},
          headerStyle: {
            backgroundColor: "white",
          },
          headerTintColor: "#fff",
        }}
      >
        <Stack.Screen name="index" options={{ title: "people" }} />
        <Stack.Screen name="create" options={{}} />
      </Stack>
    </View>
  );
}
