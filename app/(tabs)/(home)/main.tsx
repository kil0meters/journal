import Entries from "@/components/Entries";
import { StatusBar } from "expo-status-bar";
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
import { useEntries } from "@/app/query";

export default function Home() {
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const navigation = useNavigation();

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["posts"] });
  }, []);

  const { data } = useEntries();

  return (
    <>
      <StatusBar style="dark" />
      <Stack.Screen
        options={{
          title: "journal",
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
          {data && <Entries navigationPrefix="/(home)/entry/" entries={data} />}
        </ScrollView>
      </View>
    </>
  );
}
