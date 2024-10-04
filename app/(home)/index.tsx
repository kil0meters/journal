import { MoodSelector } from "@/components/MoodSelector";
import SlideUpEditor from "@/components/SlideUpEditor";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Button,
  Dimensions,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { cyrb53 } from "../util";
import { LinearGradient } from "expo-linear-gradient";

function Posts() {
  const { data, isLoading, isError, error } = useQuery<
    [
      {
        post_text: string;
        date: string;
      },
    ]
  >({
    queryKey: ["posts"],
    queryFn: async () => {
      const response = await fetch("http://localhost:3000/get-entries");
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    },
  });

  if (isError) {
    return <Text>Error: {error.message}</Text>;
  }

  if (isLoading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <View>
      {data && data.length > 0 ? (
        <LinearGradient
          colors={[`#000`, bgColorFromDate(data![0].date)]}
          style={{ height: 30 }}
        ></LinearGradient>
      ) : (
        <></>
      )}
      {data!.map((d, i) => (
        <View key={i}>
          {i !== 0 ? (
            <LinearGradient
              colors={[
                bgColorFromDate(data![i - 1].date),
                bgColorFromDate(data![i].date),
              ]}
              style={{ height: 30 }}
            ></LinearGradient>
          ) : (
            <></>
          )}
          <EntryPreview key={i} date={d!.date} post_text={d!.post_text} />
        </View>
      ))}
      {data && data.length > 0 ? (
        <LinearGradient
          colors={[bgColorFromDate(data![data.length - 1].date), `#000`]}
          style={{ height: 30 }}
        ></LinearGradient>
      ) : (
        <></>
      )}
    </View>
  );
}

function bgColorFromDate(date: string): string {
  let dateString = new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let dateHash = cyrb53(dateString);
  // let dateHash = Math.floor(Math.random() * 1000);
  let hue = (dateHash % 90) * 4;

  return `hsl(${hue}, 10%, 50%)`;
}

function EntryPreview(entry: { date: string; post_text: string }) {
  // generate color based on hash from
  let dateString = new Date(entry!.date).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let dateHash = cyrb53(dateString);
  // let dateHash = Math.floor(Math.random() * 1000);
  let hue = (dateHash % 90) * 4;

  return (
    <View
      style={{
        flex: 1,
        padding: 8,
        flexDirection: "column",
        gap: 4,
        backgroundColor: `hsl(${hue}, 10%, 50%)`,
      }}
    >
      <Text
        style={{
          color: `hsl(${hue}, 50%, 15%)`,
          fontWeight: "condensedBold",
          fontFamily: "Georgia",
          fontSize: 20,
        }}
      >
        {dateString}
      </Text>
      <Text
        style={{
          color: `hsl(${hue}, 50%, 15%)`,
          fontWeight: "condensedBold",
          fontFamily: "Georgia",
          fontSize: 14,
        }}
      >
        {entry.post_text}
      </Text>
    </View>
  );
}

export default function Home() {
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
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

          <Posts />
        </ScrollView>
      </View>

      {(Platform.OS == "ios" || Platform.OS === "android") && <SlideUpEditor />}
    </>
  );
}
