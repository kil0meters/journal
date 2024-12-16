import RenderHtml from "react-native-render-html";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import {
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import ImageCarousel from "./ImageCarousel";
import { JournalEntry } from "@/app/query";
import { useRouter } from "expo-router";

const entryBgColors = [
  "#cc6666",
  "#cc7a66",
  "#cc8f66",
  "#cca366",
  "#ccb866",
  "#cccc66",
  "#b8cc66",
  "#a3cc66",
  "#8fcc66",
  "#7acc66",
  "#66cc66",
  "#66cc7a",
  "#66cc8f",
  "#66cca3",
  "#66ccb8",
  "#66cccc",
  "#66b8cc",
  "#66a3cc",
  "#668fcc",
  "#667acc",
  "#6666cc",
  "#7a66cc",
  "#8f66cc",
  "#a366cc",
  "#b866cc",
  "#cc66cc",
  "#cc66b8",
  "#cc66a3",
  "#cc668f",
  "#cc667a",
];

const entryFgColors = [
  "#331a1a",
  "#331f1a",
  "#33241a",
  "#33291a",
  "#332e1a",
  "#33331a",
  "#2e331a",
  "#29331a",
  "#24331a",
  "#1f331a",
  "#1a331a",
  "#1a331f",
  "#1a3324",
  "#1a3329",
  "#1a332e",
  "#1a3333",
  "#1a2e33",
  "#1a2933",
  "#1a2433",
  "#1a1f33",
  "#1a1a33",
  "#1f1a33",
  "#241a33",
  "#291a33",
  "#2e1a33",
  "#331a33",
  "#331a2e",
  "#331a29",
  "#331a24",
  "#331a1f",
];

export function bgColorFromDate(date: string): string {
  let daysSinceEpoch = Math.floor(
    new Date(date).getTime() / (24 * 60 * 60 * 1000),
  );

  return entryBgColors[daysSinceEpoch % entryBgColors.length];
}

export function fgColorFromDate(date: string): string {
  let daysSinceEpoch = Math.floor(
    new Date(date).getTime() / (24 * 60 * 60 * 1000),
  );

  return entryFgColors[daysSinceEpoch % entryFgColors.length];
}

function EntryPreview(entry: JournalEntry & { navigationPrefix: string }) {
  const queryClient = useQueryClient();

  // generate color based on hash from
  let dateString = new Date(entry!.date).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  const router = useRouter();
  const { width } = useWindowDimensions();

  return (
    <TouchableOpacity
      onPress={() => {
        console.log(`Navigating to ${entry.navigationPrefix}${entry.date}`);
        router.navigate(`${entry.navigationPrefix}${entry.date}` as any);
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
          backgroundColor: bgColorFromDate(entry.date),
        }}
      >
        <Text
          style={{
            color: fgColorFromDate(entry.date),
            fontWeight: "semibold",
            fontFamily: "Helvetica Neue",
            fontSize: 20,
          }}
        >
          {dateString}
        </Text>
        <View>
          <RenderHtml
            contentWidth={width}
            source={{ html: entry.post_text }}
            baseStyle={{
              fontFamily: "Helvetica Neue",
              color: fgColorFromDate(entry.date),
            }}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function Entries({
  entries,
  navigationPrefix,
}: {
  entries: JournalEntry[];
  navigationPrefix: string;
}) {
  return (
    <View style={{ paddingBottom: 256 }}>
      <View style={{ borderTopWidth: 4 }}></View>
      {entries.map((d, i) => (
        <View key={i}>
          <EntryPreview
            navigationPrefix={navigationPrefix}
            key={i}
            date={d!.date}
            post_text={d!.post_text}
          />
        </View>
      ))}
    </View>
  );
}
