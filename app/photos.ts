import * as MediaLibrary from "expo-media-library";
import { Alert } from "react-native";

export async function getPhotosOnDate(date: Date) {
  try {
    // Request media library permissions
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Permission to access the media library is required.",
      );
      return [];
    }

    // adjust date timezone
    date.setDate(date.getUTCDate());

    // Calculate start and end timestamps of the date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Prepare query options
    const options = {
      mediaType: [MediaLibrary.MediaType.photo],
      createdAfter: startOfDay,
      createdBefore: endOfDay,
      sortBy: [[MediaLibrary.SortBy.creationTime, false]], // false for descending order
      first: 100,
    } satisfies MediaLibrary.AssetsOptions;

    let assets: MediaLibrary.Asset[] = [];
    let page = await MediaLibrary.getAssetsAsync(options);

    // Collect the first page of assets
    assets = assets.concat(page.assets);

    // Loop through remaining pages if they exist
    while (page.hasNextPage) {
      page = await MediaLibrary.getAssetsAsync({
        ...options,
        after: page.endCursor,
      });
      assets = assets.concat(page.assets);
    }

    return assets;
  } catch (error) {
    console.error("Error fetching photos:", error);
    return [];
  }
}
