import { useStore } from "@/app/store";
import CustomHeader from "@/components/CustomHeader";
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
            <CustomHeader title={props.children} color={props.tintColor} />
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
