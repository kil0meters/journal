import { MoodSelector } from "@/components/MoodSelector";
import SlideUpEditor from "@/components/SlideUpEditor";
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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  return (
    <View style={{ height: Dimensions.get("window").height }}>
      <ScrollView style={{ backgroundColor: "#fff" }}>
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          // progressViewOffset={2}
          progressBackgroundColor="#ff0000"
        />
        <MoodSelector />
      </ScrollView>

      {(Platform.OS == "ios" || Platform.OS === "android") && <SlideUpEditor />}
    </View>
  );
}
