import { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useStore } from "@/app/store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Person } from "@/app/query";
import * as ImagePicker from "expo-image-picker";

export default function CreatePerson() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageName, setSelectedImageName] = useState<string | null>(
    null,
  );
  const [selectedImageType, setSelectedImageType] = useState<string | null>(
    null,
  );

  const router = useRouter();
  const queryClient = useQueryClient();
  const jwt = useStore((s) => s.jwt);

  const createPersonMutation = useMutation({
    mutationFn: async (newPerson: {
      name: string;
      description?: string;
      image?: { uri: string; type: string; name: string };
    }) => {
      const formData = new FormData();
      formData.append("name", newPerson.name);

      if (newPerson.description) {
        formData.append("description", newPerson.description);
      }

      if (newPerson.image) {
        formData.append("image", {
          uri: newPerson.image.uri,
          type: newPerson.image.type,
          name: newPerson.image.name,
        } as any);
      }

      const response = await fetch("http://localhost:3000/add-person", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${encodeURI(jwt)}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to create person");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
      router.back();
    },
  });

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Permission to access image gallery is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setSelectedImageType(result.assets[0].type || "image/jpeg");
      setSelectedImageName(result.assets[0].fileName || "profile");
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      return;
    }

    createPersonMutation.mutate({
      name,
      description: description.trim() || undefined,
      image: selectedImage
        ? {
            uri: selectedImage,
            type: selectedImageType || "image/jpeg",
            name: selectedImageName || "profile",
          }
        : undefined,
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          animation: "slide_from_bottom",
          headerTintColor: "black",
        }}
      />
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          placeholder="Name"
          placeholderTextColor="#aaaaaa"
          value={name}
          onChangeText={setName}
          autoFocus
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description (optional)"
          placeholderTextColor="#aaaaaa"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />
        <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
          <Text style={styles.imageButtonText}>Select Profile Picture</Text>
        </TouchableOpacity>

        <Text style={styles.imageDescription}>
          The image should have a single face in plain view.
        </Text>

        {selectedImage && (
          <View style={styles.imagePreviewContainer}>
            <Image
              source={{ uri: selectedImage }}
              style={styles.imagePreview}
            />
          </View>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          disabled={createPersonMutation.isPending}
        >
          <Text style={styles.buttonText}>
            {createPersonMutation.isPending ? "Creating..." : "Create Person"}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
    height: "100%",
    backgroundColor: "white",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    color: "black",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  imageButton: {
    backgroundColor: "#f0f0f0",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  imageButtonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "600",
  },
  imagePreviewContainer: {
    alignItems: "center",
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
    resizeMode: "cover",
  },
  imageDescription: {
    fontSize: 12,
    color: "#333",
  },
  button: {
    backgroundColor: "black",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
