import { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Switch,
  ScrollView,
} from "react-native";
import { Button, Text, StyleSheet, Platform } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/app/store";
import CustomHeader from "@/components/CustomHeader";

function PhotoBackup() {
  const photoBackupEnabled = useStore((store) => store.photoBackupEnabled);
  const photosBackedUp = useStore((store) => store.photosBackedUp);
  const photosToBackup = useStore((store) => store.photosToBackup);

  return (
    <View
      style={{
        flexDirection: "column",
        padding: 16,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <View>
          <Text
            style={{
              fontSize: 20,
              color: "#000",
            }}
          >
            backup photos
          </Text>

          {photosBackedUp == 0 && photosToBackup == 0 ? (
            <Text style={{ color: "#aaa", fontSize: 11 }}>
              All photos backed up.
            </Text>
          ) : (
            <Text style={{ color: "#aaa", fontSize: 11 }}>
              {photosBackedUp} out of {photosToBackup} photos backed up
            </Text>
          )}
        </View>

        <Switch
          value={photoBackupEnabled}
          onValueChange={(value) =>
            useStore.getState().setPhotoBackupEnabled(value)
          }
        />
      </View>
    </View>
  );
}

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  let store = useStore();
  let router = useRouter();
  const queryClient = useQueryClient();

  const handleLogin = async () => {
    try {
      const response = await fetch("http://localhost:3000/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.text();

      if (response.ok) {
        // Handle successful login
        console.log("Login successful:", data);
        queryClient.invalidateQueries({ queryKey: ["posts"] });
        store.logIn(data);
        router.replace("/main");
      } else {
        Alert.alert("Error", "Login failed");
      }
    } catch (error) {
      Alert.alert("Error", "Login failed");
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "settings",
          headerTintColor: "black",
        }}
      />
      <SafeAreaView style={styles.container}>
        <PhotoBackup />

        <View style={{ padding: 8 }}>
          <Button
            onPress={() => {
              useStore.getState().logOut();
              router.navigate("/");
            }}
            title="Log Out"
          />
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    flex: 1,
    padding: 20,
  },
  input: {
    width: "100%",
    color: "black",
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 5,
    width: "100%",
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
  },
});
