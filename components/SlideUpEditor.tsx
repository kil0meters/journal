import {
  CoreBridge,
  PlaceholderBridge,
  RichText,
  TenTapStartKit,
  Toolbar,
  useEditorBridge,
} from "@10play/tentap-editor";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import React, { useCallback, useRef } from "react";
import {
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";

export default function SlideUpEditor() {
  const bottomSheetRef = useRef<BottomSheet>(null);

  const handleSheetChanges = useCallback((index: number) => {
    console.log("handleSheetChanges", index);
  }, []);

  const editor = useEditorBridge({
    autofocus: false,
    avoidIosKeyboard: true,
    bridgeExtensions: [
      ...TenTapStartKit,
      CoreBridge.configureCSS(`* { font-family: "Georgia", serif; }`),
      PlaceholderBridge.configureExtension({ placeholder: "" }),
    ],
  });

  return (
    <BottomSheet
      style={styles.bottomSheet}
      backgroundStyle={{
        backgroundColor: "#EDBF92",
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
        <View style={{ flex: 1, alignSelf: "stretch" }}>
          <Text
            style={{
              alignSelf: "center",
              fontSize: 20,
              fontFamily: "Georgia",
            }}
          >
            {new Date().toLocaleString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
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
