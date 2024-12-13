import { SafeAreaView } from "react-native";
import { Text, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { usePeople } from "@/app/query";
import PersonList from "@/components/PersonList";

export default function PeoplePage() {
  const { data, error, isLoading } = usePeople();

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (error) {
    return <Text>Error loading people: {error.message}</Text>;
  }

  if (!data) {
    return <Text>Add some people</Text>;
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTintColor: "black",
        }}
      />
      <SafeAreaView style={styles.container}>
        <PersonList people={data} />
      </SafeAreaView>
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
});
