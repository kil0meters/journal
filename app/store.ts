import { create } from "zustand";
import { combine, persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useStore = create(
  persist(
    combine(
      {
        loggedIn: false,
        jwt: "",
        hasFetchedEntries: false,
      },
      (set) => ({
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
