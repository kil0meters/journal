import { getPhotosOnDate } from "@/app/photos";
import { useEntries } from "@/app/query";
import { useStore } from "@/app/store";
import { bgColorFromDate, fgColorFromDate } from "@/components/Entries";
import {
  CoreBridge,
  EditorBridge,
  PlaceholderBridge,
  RichText,
  TenTapStartKit,
  Toolbar,
  useEditorBridge,
} from "@10play/tentap-editor";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

function cancellableSend(func: () => void, delayMs: number) {
  let timeoutId: any;

  return () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(func, delayMs);
  };
}

export default function Entry() {
  const { date } = useLocalSearchParams() as { date: string };

  const queryClient = useQueryClient();

  const serverUpdate = useCallback(
    cancellableSend(async () => {
      // don't save if we haven't received entries from the server at least once
      if (!useStore.getState().hasFetchedEntries) return;

      let newData = {
        date: date,
        post_text: await editor.getText(),
      };

      console.log(`saving: ${JSON.stringify(newData)}`);

      const response = await fetch("http://localhost:3000/save-entry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useStore.getState().jwt}`,
        },
        body: JSON.stringify(newData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to post data");
      }

      queryClient.invalidateQueries({ queryKey: ["posts"] });
    }, 500),
    [],
  );

  const { data, isLoading, isError, error } = useEntries();
  let currentEntry = data?.find((entry) => entry.date == date);

  const editor = useEditorBridge({
    initialContent: currentEntry?.post_text,
    autofocus: false,
    avoidIosKeyboard: true,
    bridgeExtensions: [
      ...TenTapStartKit,
      CoreBridge.configureCSS(`* { font-family: "Helvetica Neue", serif; }`),
      PlaceholderBridge.configureExtension({ placeholder: "" }),
    ],
    onChange: serverUpdate,
  });

  let dateString = new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  useEffect(() => {
    if (currentEntry) editor.setContent(currentEntry.post_text);
  }, [currentEntry]);

  // const { data, isLoading, isError, error } = useQuery({
  //   queryKey: [`${date}`],
  //   queryFn: async () => {
  //     return await getPhotosOnDate(new Date(date));
  //   },
  // });

  return (
    <>
      <Stack.Screen
        options={{
          title: dateString,
          headerTintColor: fgColorFromDate(date),
          headerStyle: {
            backgroundColor: bgColorFromDate(date),
          },
        }}
      />
      <View
        style={{
          flex: 1,
          alignSelf: "stretch",
          backgroundColor: "white",
        }}
      >
        <View
          style={{
            flex: 1,
            alignSelf: "stretch",
            padding: 12,
          }}
        >
          <RichText
            style={{
              backgroundColor: "transparent",
            }}
            editor={editor}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{
              position: "absolute",
              width: "100%",
              bottom: 0,
            }}
          >
            <Toolbar editor={editor} />
          </KeyboardAvoidingView>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
