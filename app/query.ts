import { useQuery } from "@tanstack/react-query";
import { useStore } from "./store";

const serverRequest = async (endpoint: string) => {
  const response = await fetch(`http://localhost:3000${endpoint}`, {
    headers: {
      Authorization: `Bearer ${encodeURI(useStore.getState().jwt)}`,
    },
  });

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  return response.json();
};

export type JournalEntry = {
  date: string;
  post_text: string;
};

export type Person = {
  id: number;
  name: string;
  description?: string;
};

export const usePeople = () =>
  useQuery<Person[]>({
    queryKey: ["people"],
    queryFn: async () => serverRequest("/get-people"),
  });

export const usePeopleForEntry = (date: string) =>
  useQuery<Person[]>({
    queryKey: [`people-for-entry-${date}`],
    queryFn: async () => serverRequest(`/get-people-for-entry/${date}`),
  });

export const usePhotosForEntry = (date: string) =>
  useQuery<string[]>({
    queryKey: [`photos-for-entry-${date}`],
    queryFn: async () => serverRequest(`/get-photos-for-entry/${date}`),
  });

export const useEntries = () =>
  useQuery<JournalEntry[]>({
    queryKey: ["posts"],
    queryFn: async () => {
      const response = await serverRequest("/get-entries");
      useStore.getState().setHasFetchedEntries();
      return response;
    },
  });

export const useEntriesPerPerson = (personId: number) =>
  useQuery<JournalEntry[]>({
    queryKey: [`entries-for-person-${personId}`],
    queryFn: () => {
      return serverRequest(`/get-entries-for-person/${personId}`);
    },
  });
