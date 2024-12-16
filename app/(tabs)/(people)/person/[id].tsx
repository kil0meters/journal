import { useLocalSearchParams } from "expo-router";
import { View, StyleSheet, Dimensions, ScrollView } from "react-native";
import { Text } from "react-native";
import { Stack } from "expo-router";
import { Image } from "expo-image";
import { useEntriesPerPerson, usePeople } from "@/app/query";
import Entries from "@/components/Entries";
import { useStore } from "@/app/store";

function PersonEntries({ personId }: { personId: number }) {
  const { data, isLoading, error } = useEntriesPerPerson(personId);

  if (!data) {
    return <Text>loading...</Text>;
  }

  return <Entries navigationPrefix={`/(home)/entry/`} entries={data} />;
}

export default function PersonPage() {
  const { id } = useLocalSearchParams();
  const { data: people, isLoading, error } = usePeople();

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (error) {
    return <Text>Error loading person: {error.message}</Text>;
  }

  const person = people?.find((p) => p.id === Number(id));

  if (!person) {
    return <Text>Person not found</Text>;
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTintColor: "black",
          title: person.name,
        }}
      />
      <View style={{ borderTopWidth: 4, flex: 1, backgroundColor: "white" }}>
        <ScrollView style={styles.container}>
          <Image
            source={{
              uri: `http://localhost:3000/get-profile-photo/${person.id}`,
              headers: {
                Authorization: `Bearer ${useStore.getState().jwt}`,
              },
            }}
            style={styles.profileImage}
            contentFit="cover"
          />
          <View style={styles.infoContainer}>
            <Text style={styles.name}>{person.name}</Text>
            {person.description && (
              <Text style={styles.description}>{person.description}</Text>
            )}
          </View>

          <PersonEntries personId={person.id} />
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  profileImage: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").width, // Makes it square
  },
  infoContainer: {
    padding: 20,
    borderTopWidth: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
  },
});
