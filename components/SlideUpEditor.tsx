import { useStore } from "@/app/store";
import { Entry } from "@/app/utils/types";
import {
  CoreBridge,
  EditorBridge,
  PlaceholderBridge,
  RichText,
  TenTapStartKit,
  Toolbar,
  useEditorBridge,
} from "@10play/tentap-editor";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useEffect, useRef } from "react";
import {
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { bgColorFromDate } from "./Entries";
import { debounce } from "lodash";
import ImageCarousel from "./ImageCarousel";
import { getPhotosOnDate } from "@/app/photos";

function EditorBody({ editor }: { editor: EditorBridge }) {
  const editingDate = useStore((state) => state.editingDate);

  let dateString = new Date(editingDate).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [`${editingDate}`],
    queryFn: async () => {
      return await getPhotosOnDate(new Date(editingDate));
    },
  });

  return (
    <View style={{ flex: 1, alignSelf: "stretch" }}>
      <Text
        style={{
          alignSelf: "center",
          fontSize: 20,
          fontFamily: "Georgia",
        }}
      >
        {dateString}
      </Text>

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
  );
}

let prevSetEditingDate: string | undefined = undefined;

export default function SlideUpEditor() {
  const editingDate = useStore((state) => state.editingDate);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const queryClient = useQueryClient();

  const handleSheetChanges = useCallback((index: number) => {
    console.log("handleSheetChanges", index);
  }, []);

  const serverUpdate = useCallback(
    debounce(async () => {
      let newData = {
        date: useStore.getState().editingDate,
        post_text: await editor.getText(),
      };
      console.log(`saving: ${JSON.stringify(newData)}`);

      const response = await fetch("http://localhost:3000/save-entry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to post data");
      }

      queryClient.invalidateQueries({ queryKey: ["posts"] });
    }, 300),
    [],
  );

  const { data, isLoading, isError, error } = useQuery<Entry[]>({
    queryKey: ["posts"],
    queryFn: async () => {
      const response = await fetch("http://localhost:3000/get-entries");
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    },
  });

  let currentEntry = data?.find((entry) => entry.date == editingDate);

  const editor = useEditorBridge({
    initialContent: currentEntry?.post_text,
    autofocus: false,
    avoidIosKeyboard: true,
    bridgeExtensions: [
      ...TenTapStartKit,
      CoreBridge.configureCSS(`* { font-family: "Georgia", serif; }`),
      PlaceholderBridge.configureExtension({ placeholder: "" }),
    ],
    onChange: serverUpdate,
  });

  useEffect(() => {
    if (currentEntry && editor && prevSetEditingDate != editingDate) {
      editor.setContent(currentEntry.post_text);
      prevSetEditingDate = editingDate;
    }
  });

  return (
    <BottomSheet
      style={styles.bottomSheet}
      index={1}
      backgroundStyle={{
        backgroundColor: bgColorFromDate(editingDate),
      }}
      snapPoints={["10%", "100%"]}
      ref={bottomSheetRef}
      onAnimate={(from, to) => {
        if (to === 0) editor.blur();
        else editor.focus();
      }}
      onChange={handleSheetChanges}
    >
      <BottomSheetView style={styles.contentContainer}>
        <EditorBody editor={editor} />
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  bottomSheet: {
    shadowColor: "rgba(1, 1, 1, 0.2)",
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
  },
});
