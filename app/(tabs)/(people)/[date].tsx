import { humanReadableDate } from "@/app/util";
import { bgColorFromDate, fgColorFromDate } from "@/components/Entries";
import EntryEditor from "@/components/EntryEditor";
import { Stack, useLocalSearchParams } from "expo-router";

export default function EntryPage() {
  const { id, date } = useLocalSearchParams() as { date: string; id: string };

  return (
    <>
      <Stack.Screen
        options={{
          title: humanReadableDate(date),
          headerTintColor: fgColorFromDate(date),
          headerStyle: {
            backgroundColor: bgColorFromDate(date),
          },
        }}
      />
      <EntryEditor date={date} />
    </>
  );
}
