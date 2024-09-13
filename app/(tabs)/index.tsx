import { MoodSelector } from "@/components/MoodSelector";
import { useCallback, useState } from "react";
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  View,
  Text,
} from "react-native";

export default function Home() {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  return (
    <View style={{ height: Dimensions.get("window").height }}>
      <View
        style={{
          position: "absolute",
          backgroundColor: "black",
          width: Dimensions.get("window").width,
          height: 60,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            color: "black",
          }}
        >
          test text
        </Text>
      </View>

      <ScrollView style={{ backgroundColor: "#fff" }}>
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="transparent"
          colors={["transparent"]}
          style={{ backgroundColor: "transparent" }}
          // progressViewOffset={2}
        />
        <MoodSelector />
      </ScrollView>
    </View>
  );
}
