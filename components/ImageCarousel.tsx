import * as React from "react";
import { View } from "react-native";
import type { ICarouselInstance } from "react-native-reanimated-carousel";
import Carousel from "react-native-reanimated-carousel";
import { Image } from "expo-image";

export default function ImageCarousel({ imageUrls }: { imageUrls: string[] }) {
  const ref = React.useRef<ICarouselInstance>(null);

  return (
    <View
      id="carousel-component"
      dataSet={{ kind: "basic-layouts", name: "stack" }}
    >
      <Carousel
        ref={ref}
        data={imageUrls}
        height={220}
        width={440 * 0.75}
        loop={true}
        snapEnabled={true}
        style={{
          width: "100%",
          height: 240,
        }}
        mode={"horizontal-stack"}
        modeConfig={{
          rotateZDeg: 0,
          snapDirection: "left",
          stackInterval: 18,
        }}
        renderItem={({ item: imageUrl, index }) => {
          return (
            <Image
              style={{ height: "100%", width: "100%", borderRadius: 12 }}
              source={{ uri: imageUrl }}
              contentFit="cover"
            />
          );
        }}
      />
    </View>
  );
}
