import { create } from "zustand";
import type { Source } from "../lib/api";

type DrawerState = {
  activeSource: Source | null;
  open: boolean;
  openDrawer: (source: Source) => void;
  closeDrawer: () => void;
};

export const useDrawerStore = create<DrawerState>((set) => ({
  activeSource: null,
  open: false,
  openDrawer: (source) => set({ activeSource: source, open: true }),
  closeDrawer: () => set({ open: false }),
}));
