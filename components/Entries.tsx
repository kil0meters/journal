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
import { Entry } from "@/app/utils/types";
import { useEntries } from "@/app/query";
import { useNavigation, useRouter } from "expo-router";

export function bgColorFromDate(date: string): string {
  let dateString = new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  let dateHash = cyrb53(dateString);
  let hue = (dateHash % 90) * 4;

  return `hsl(${hue}, 10%, 50%)`;
}

export function fgColorFromDate(date: string): string {
  let dateString = new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  let dateHash = cyrb53(dateString);
  let hue = (dateHash % 90) * 4;

  return `hsl(${hue}, 50%, 15%)`;
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

  const router = useRouter();
  const setEditingDate = useStore((store) => store.setEditingDate);
  const setSlideUpEditorState = useStore(
    (store) => store.setSlideUpEditorState,
  );

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
        console.log(`navigating to: /entry/${entry.date}`);
        router.navigate(`/entry/${entry.date}`);
      }}
      activeOpacity={1}
    >
      <View
        style={{
          flex: 1,
          padding: 8,
          flexDirection: "column",
          gap: 8,
          borderColor: "black",
          borderBottomWidth: 4,
          backgroundColor: `hsl(${hue}, 10%, 50%)`,
        }}
      >
        <Text
          style={{
            color: `hsl(${hue}, 50%, 15%)`,
            fontWeight: "semibold",
            fontFamily: "Helvetica Neue",
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
              fontWeight: "regular",
              fontFamily: "Helvetica Neue",
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
  const { data, isLoading, isError, error } = useEntries();

  if (isError) {
    return <Text>Error: {error.message}</Text>;
  }

  if (isLoading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <View style={{ paddingBottom: 256 }}>
      {data!.map((d, i) => (
        <View key={i}>
          <EntryPreview key={i} date={d!.date} post_text={d!.post_text} />
        </View>
      ))}
    </View>
  );
}
