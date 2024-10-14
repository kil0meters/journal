import { create } from "zustand";
import { combine } from "zustand/middleware";

function todayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const day = String(today.getDate()).padStart(2, "0");

  const formattedDate = `${year}-${month}-${day}`;
  return formattedDate;
}

export const useStore = create(
  combine(
    {
      editingDate: todayDate(),
      slideUpEditorState: 0,
    },
    (set) => ({
      setEditingDate: (newEditingDate: string) =>
        set({ editingDate: newEditingDate }),
      setSlideUpEditorState: (newSlideUpEditorState: number) =>
        set({ slideUpEditorState: newSlideUpEditorState }),
    }),
  ),
);
