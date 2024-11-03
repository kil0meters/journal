import Entries from "@/components/Entries";
import SlideUpEditor from "@/components/SlideUpEditor";
import { useQueryClient } from "@tanstack/react-query";
import { Stack, useNavigation } from "expo-router";
import { useCallback, useState } from "react";
import {
  Dimensions,
  Platform,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";

export default function Home() {
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const navigation = useNavigation();

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["posts"] });
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          title: "journal app",
          headerTintColor: "black",
        }}
      />
      <View
        style={{
          height: Dimensions.get("window").height,
          backgroundColor: "white",
        }}
      >
        <ScrollView style={{ backgroundColor: "#fff" }}>
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            // progressViewOffset={2}
            progressBackgroundColor="#ff0000"
          />

          <Entries />
        </ScrollView>
      </View>
    </>
  );
}
