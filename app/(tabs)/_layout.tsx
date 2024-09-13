import SlideUpEditor from "@/components/SlideUpEditor";
import { Stack } from "expo-router";
import React from "react";
import { Button, Text, View, StyleSheet, Platform } from "react-native";

export default function Layout() {
  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          // headerRight: () => <Text style={{ color: "#fff" }}>right</Text>,
          headerTitle: (props) => (
            <View style={{ flex: 1, flexDirection: "row" }}>
              <Text
                style={{
                  color: "white",
                  fontWeight: "condensedBold",
                  fontFamily: "Georgia",
                  fontSize: 24,
                }}
              >
                Journal
              </Text>

              <View style={{ marginLeft: "auto" }}>
                <Button title="photos" />
              </View>
            </View>
          ),
          headerTitleAlign: "left",
          headerStyle: {
            backgroundColor: "#000",
          },
          headerTintColor: "#fff",
        }}
      >
        <Stack.Screen name="index" options={{}} />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
