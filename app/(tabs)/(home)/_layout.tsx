import { useStore } from "@/app/store";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { Button, Text, View, StyleSheet, Platform } from "react-native";

export default function Layout() {
  const loggedIn = useStore((s) => s.loggedIn);
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerTitle: (props) => (
            <View style={{ flex: 1, flexDirection: "row" }}>
              <Text
                style={{
                  color: props.tintColor,
                  fontWeight: "condensedBold",
                  fontFamily: "Helvetica Neue",
                  fontSize: 24,
                }}
              >
                {props.children}
              </Text>
            </View>
          ),
          headerBackTitleVisible: false,
          headerTitleAlign: "left",
          headerTitleStyle: {},
          headerStyle: {
            backgroundColor: "white",
          },
          contentStyle: {
            borderColor: "#000",
            borderTopWidth: 4,
          },
          headerTintColor: "#fff",
        }}
      >
        <Stack.Screen name="index" options={{}} />
        <Stack.Screen name="main" options={{}} />
        <Stack.Screen name="mood_photo_view" options={{}} />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    flex: 1,
  },
});
