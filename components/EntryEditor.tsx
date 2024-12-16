import Gallery, { RenderItemInfo } from "react-native-awesome-gallery";
import { useAtom, atom } from "jotai";
import {
  JournalEntry,
  Person,
  PhotoWithBoundingBoxes,
  useEntries,
  usePeople,
  usePeopleForEntry,
  usePhotosForEntry,
} from "@/app/query";
import { useStore } from "@/app/store";
import { humanReadableDate } from "@/app/util";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
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
import { useQueryClient } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import PagerView from "react-native-pager-view";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Modal,
} from "react-native";
import PersonList from "./PersonList";
import { Image, ImageBackground } from "expo-image";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { TouchableOpacity } from "react-native-gesture-handler";

const selectedPhotoAtom = atom<string | null>(null);

function cancellableSend(func: () => void, delayMs: number) {
  let timeoutId: any;

  return () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(func, delayMs);
  };
}

const renderItem = ({
  item,
  setImageDimensions,
}: RenderItemInfo<PhotoWithBoundingBoxes>) => {
  const [_, setSelectedPhoto] = useAtom(selectedPhotoAtom);
  const [imageDimensions, setImageDimensions2] = useState({
    width: 1,
    height: 1,
  });

  const router = useRouter();

  return (
    <View style={{ flex: 1, alignItems: "center", paddingTop: 128 }}>
      <ImageBackground
        source={{
          uri: `http://localhost:3000${item.url}`,
          headers: {
            Authorization: `Bearer ${useStore.getState().jwt}`,
          },
        }}
        imageStyle={[StyleSheet.absoluteFillObject]}
        contentFit="contain"
        onLoad={(e) => {
          const { width, height } = e.source;
          setImageDimensions({ width, height });
          setImageDimensions2({ width, height });
        }}
      >
        <View
          style={{
            aspectRatio: imageDimensions.width / imageDimensions.height,
            alignSelf: "center",
            width: "100%",
          }}
        >
          {item.bounding_boxes?.map(({ bounding_box: bb, person }, index) => (
            <View
              key={index}
              style={{
                position: "absolute",
                left: `${(bb[0] / imageDimensions.width) * 100}%`,
                // top: `${(bb[1] / imageDimensions.height) * 100}%`,
                top: `${(bb[1] / imageDimensions.height) * 100}%`,
                width: `${((bb[2] - bb[0]) / imageDimensions.width) * 100}%`,
                height: `${((bb[3] - bb[1]) / imageDimensions.height) * 100}%`,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.5)",
              }}
            >
              <TouchableOpacity
                style={{ width: "100%", height: "100%" }}
                onPress={() => {
                  setSelectedPhoto(null);
                  router.navigate(`/(people)/person/${person.id}`);
                }}
              ></TouchableOpacity>
            </View>
          ))}
        </View>
      </ImageBackground>
    </View>
  );
};

function PhotoGrid({ photos }: { photos: PhotoWithBoundingBoxes[] }) {
  const [selectedPhoto, setSelectedPhoto] = useAtom(selectedPhotoAtom);

  console.log(photos);

  return (
    <ScrollView>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {photos.map((photo, index) => (
          <Pressable
            key={index}
            style={{
              width: "33.333333%",
              aspectRatio: 1,
            }}
            onPress={() => setSelectedPhoto(photo.url)}
          >
            <Image
              source={{
                uri: `http://localhost:3000${photo.url}`,
                headers: {
                  Authorization: `Bearer ${useStore.getState().jwt}`,
                },
              }}
              style={{
                width: "100%",
                height: "100%",
              }}
            />
          </Pressable>
        ))}
      </View>

      <Modal
        visible={!!selectedPhoto}
        transparent={true}
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <Animated.View
          key={"modal-child"}
          entering={FadeIn.duration(400)}
          exiting={FadeOut.duration(400)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.9)",
          }}
        >
          <Gallery
            renderItem={renderItem}
            data={photos}
            initialIndex={photos.findIndex(
              (photo) => photo.url === selectedPhoto,
            )}
            onSwipeToClose={() => setSelectedPhoto(null)}
          />
        </Animated.View>
      </Modal>
    </ScrollView>
  );
}

function EntryEditor({
  date,
  currentEntry,
}: {
  date: string;
  currentEntry: JournalEntry;
}) {
  const queryClient = useQueryClient();

  const serverUpdate = useCallback(
    cancellableSend(async () => {
      // don't save if we haven't received entries from the server at least once
      if (!useStore.getState().hasFetchedEntries) return;

      let newData = {
        date: date,
        post_text: await editor.getHTML(),
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

  useEffect(() => {
    if (currentEntry) editor.setContent(currentEntry.post_text);
  }, [currentEntry]);

  return (
    <View
      style={{
        flex: 1,
        alignSelf: "stretch",
        paddingHorizontal: 16,
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
  );
}

export default function EntryView({ date }: { date: string }) {
  const { data, isLoading, isError, error } = useEntries();
  const { data: people } = usePeopleForEntry(date);
  const { data: photos } = usePhotosForEntry(date);
  let currentEntry = data?.find((entry) => entry.date == date);
  const pagerView = useRef<PagerView>(null);

  let dateString = humanReadableDate(date);

  const [selectedIndex, setSelectedIndex] = useState(0);

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
            backgroundColor: "#000",
            padding: 8,
          }}
        >
          <SegmentedControl
            values={["Entry", "Photos", "People"]}
            selectedIndex={selectedIndex}
            onChange={(event) => {
              pagerView.current?.setPage(
                event.nativeEvent.selectedSegmentIndex,
              );
            }}
          ></SegmentedControl>
        </View>
        <PagerView
          ref={pagerView}
          style={{
            flex: 1,
            alignSelf: "stretch",
          }}
          scrollEnabled={false}
          initialPage={selectedIndex}
          onPageScroll={(event) => {
            setSelectedIndex(event.nativeEvent.position);
          }}
        >
          <View key={0}>
            <EntryEditor currentEntry={currentEntry!} date={date} />
          </View>
          <View key={1}>{photos && <PhotoGrid photos={photos} />}</View>
          <View key={2}>{people && <PersonList people={people} />}</View>
        </PagerView>
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
