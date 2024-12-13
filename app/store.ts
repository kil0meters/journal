import { create } from "zustand";
import { combine, persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useStore = create(
  persist(
    combine(
      {
        photoBackupEnabled: false,
        photosToBackup: 0,
        photosBackedUp: 0,

        loggedIn: false,
        jwt: "",
        hasFetchedEntries: false,
      },
      (set) => ({
        setPhotoBackupEnabled: (val: boolean) =>
          set({ photoBackupEnabled: val }),

        setPhotosBackupProgress: (toBackup: number, backedUp: number) =>
          set({ photosToBackup: toBackup, photosBackedUp: backedUp }),

        setHasFetchedEntries: () => set({ hasFetchedEntries: true }),
        logIn: (jwt: string) => set({ jwt: jwt, loggedIn: true }),
        logOut: () => set({ jwt: "", loggedIn: false }),
      }),
    ),
    {
      name: "user-storage", // Unique name for the storage key
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
