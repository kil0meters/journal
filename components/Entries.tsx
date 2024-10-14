import { getPhotosOnDate } from "@/app/photos";
import { cyrb53 } from "@/app/util";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ImageCarousel from "./ImageCarousel";
import { useStore } from "@/app/store";

export function bgColorFromDate(date: string): string {
  let dateString = new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  let dateHash = cyrb53(dateString);
  // let dateHash = Math.floor(Math.random() * 1000);
  let hue = (dateHash % 90) * 4;

  return `hsl(${hue}, 10%, 50%)`;
}

function EntryPreview(entry: { date: string; post_text: string }) {
  const queryClient = useQueryClient();

  // generate color based on hash from
  let dateString = new Date(entry!.date).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  const setEditingDate = useStore((store) => store.setEditingDate);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [entry.date],
    queryFn: async () => {
      return await getPhotosOnDate(new Date(entry.date));
    },
  });

  let dateHash = cyrb53(dateString);
  let hue = (dateHash % 90) * 4;

  if (data) {
    console.log(data);
  }

  return (
    <TouchableOpacity
      onPress={() => {
        setEditingDate(entry.date);
        queryClient.invalidateQueries({ queryKey: ["active-post"] });
      }}
      activeOpacity={1}
    >
      <View
        style={{
          flex: 1,
          padding: 8,
          flexDirection: "column",
          gap: 8,
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
        <View>
          {data && data.length > 0 ? (
            <ImageCarousel imageUrls={data.map((img) => img.uri)} />
          ) : (
            <></>
          )}
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
      </View>
    </TouchableOpacity>
  );
}

export default function Entries() {
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
    <View style={{ paddingBottom: 256 }}>
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
