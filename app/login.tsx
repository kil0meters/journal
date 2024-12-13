import { useState } from "react";
import { View, TextInput, TouchableOpacity, Alert } from "react-native";
import { Button, Text, StyleSheet, Platform } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/app/store";

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
          title: "Login",
          headerTintColor: "white",
        }}
      />
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          placeholder="Username"
          placeholderTextColor="gray"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          autoCapitalize="none"
          placeholderTextColor="gray"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    flex: 1,
    alignItems: "center",
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
