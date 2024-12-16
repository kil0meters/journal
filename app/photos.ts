import * as MediaLibrary from "expo-media-library";
import { Alert } from "react-native";
import { useStore } from "./store";
import * as SQLite from "expo-sqlite";
import mime from "mime";

async function uploadPhotos(
  db: SQLite.SQLiteDatabase,
  assets: MediaLibrary.Asset[],
) {
  const store = useStore.getState();

  for (const asset of assets) {
    const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
    const formData = new FormData();

    if (assetInfo.mediaType != "photo") continue;

    // @ts-ignore
    formData.append("image", {
      uri: assetInfo.localUri || assetInfo.uri,
      name: assetInfo.filename,
      type: mime.getType(assetInfo.filename),
    });

    console.log(formData);

    let response = await fetch(
      `http://localhost:3000/upload-image/${Math.floor(asset.creationTime / 1000)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${encodeURI(useStore.getState().jwt)}`,
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      },
    );

    if (response.ok) {
      await db.runAsync("INSERT INTO uploaded_photos (photo_id) VALUES (?)", [
        asset.id,
      ]);

      store.setPhotosBackupProgress(
        store.photosBackedUp + 1,
        store.photosToBackup,
      );
    }
  }

  return;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function synchronizePhotos() {
  const store = useStore.getState();

  while (true) {
    if (store.photoBackupEnabled && store.loggedIn) {
      console.log("synchronizing photos");

      const db = await SQLite.openDatabaseAsync("database.sqlite");
      await db.execAsync(
        "CREATE TABLE IF NOT EXISTS uploaded_photos (id INTEGER PRIMARY KEY NOT NULL, photo_id TEXT NOT NULL)",
      );

      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Permission to access the media library is required.",
        );
        return;
      }

      // Prepare query options
      const options = {
        mediaType: [MediaLibrary.MediaType.photo],
        sortBy: [[MediaLibrary.SortBy.creationTime, false]], // false for descending order
        first: 20,
      } satisfies MediaLibrary.AssetsOptions;

      let assets: MediaLibrary.Asset[] = [];
      let page = await MediaLibrary.getAssetsAsync(options);
      assets = assets.concat(page.assets);

      // Loop through remaining pages if they exist
      while (page.hasNextPage) {
        page = await MediaLibrary.getAssetsAsync({
          ...options,
          after: page.endCursor,
        });
        assets = assets.concat(page.assets);
      }

      const uploadedPhotoIds = (
        await db.getAllAsync<{ photo_id: string }>(
          "SELECT photo_id FROM uploaded_photos",
        )
      ).map((photo) => photo.photo_id);

      const filteredAssets = assets.filter(
        (asset) => !uploadedPhotoIds.includes(asset.id),
      );

      store.setPhotosBackupProgress(filteredAssets.length, 0);

      await uploadPhotos(db, filteredAssets);
    }

    await sleep(10000);
  }
}
