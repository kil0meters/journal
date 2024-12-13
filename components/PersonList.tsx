import { View, TouchableOpacity, ScrollView } from "react-native";
import { Text } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Person } from "@/app/query";
import { useStore } from "@/app/store";

export default function PersonList({ people }: { people: Person[] }) {
  let router = useRouter();

  return (
    <ScrollView style={{ width: "100%" }}>
      {people.map((person, i) => (
        <View key={person.id}>
          {i != 0 && (
            <View style={{ borderTopWidth: 4, borderColor: "#000" }}></View>
          )}
          <TouchableOpacity
            onPress={() => {
              router.navigate(`/(people)/person/${person.id}`);
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 12,
              }}
            >
              <Image
                source={{
                  uri: `http://localhost:3000/get-profile-photo/${person.id}`,
                  headers: {
                    Authorization: `Bearer ${useStore.getState().jwt}`,
                  },
                }}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  marginRight: 10,
                }}
              />
              <Text style={{ fontSize: 16 }}>{person.name}</Text>
              {person.description && (
                <Text style={{ fontSize: 14, color: "#666", marginLeft: 10 }}>
                  {person.description}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}
