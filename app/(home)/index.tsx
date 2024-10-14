import Entries from "@/components/Entries";
import SlideUpEditor from "@/components/SlideUpEditor";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "expo-router";
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
      <View
        style={{
          height: Dimensions.get("window").height,
          backgroundColor: "#000000",
        }}
      >
        <ScrollView style={{ backgroundColor: "#000" }}>
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            // progressViewOffset={2}
            progressBackgroundColor="#ff0000"
          />

          <Entries />
        </ScrollView>
      </View>

      {(Platform.OS == "ios" || Platform.OS === "android") && <SlideUpEditor />}
    </>
  );
}
