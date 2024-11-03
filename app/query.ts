import { useQuery } from "@tanstack/react-query";
import { Entry } from "./utils/types";
import { useStore } from "./store";

export const useEntries = () =>
  useQuery<Entry[]>({
    queryKey: ["posts"],
    queryFn: async () => {
      const response = await fetch("http://localhost:3000/get-entries", {
        headers: {
          Authorization: `Bearer ${encodeURI(useStore.getState().jwt)}`,
        },
      });
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      useStore.getState().setHasFetchedEntries();
      return response.json();
    },
  });
