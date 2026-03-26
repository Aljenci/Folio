import { create } from "zustand";

/** Maximum number of entries retained in navigation history. */
const MAX_HISTORY = 50;

interface HistoryState {
  /** Ordered list of absolute file paths. */
  entries: string[];
  /** Index into `entries` pointing at the currently displayed file. */
  currentIndex: number;

  /** Push a new path, discarding any forward history. */
  push: (filePath: string) => void;
  /** Navigate back one step; returns the path to load, or null if at start. */
  goBack: () => string | null;
  /** Navigate forward one step; returns the path to load, or null if at end. */
  goForward: () => string | null;
  canGoBack: () => boolean;
  canGoForward: () => boolean;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  entries: [],
  currentIndex: -1,

  push: (filePath) =>
    set((state) => {
      // Truncate any forward history then append, capping at MAX_HISTORY
      const entries = [
        ...state.entries.slice(0, state.currentIndex + 1),
        filePath,
      ].slice(-MAX_HISTORY);
      return { entries, currentIndex: entries.length - 1 };
    }),

  goBack: () => {
    const { entries, currentIndex } = get();
    if (currentIndex <= 0) return null;
    const newIndex = currentIndex - 1;
    set({ currentIndex: newIndex });
    return entries[newIndex];
  },

  goForward: () => {
    const { entries, currentIndex } = get();
    if (currentIndex >= entries.length - 1) return null;
    const newIndex = currentIndex + 1;
    set({ currentIndex: newIndex });
    return entries[newIndex];
  },

  canGoBack: () => get().currentIndex > 0,
  canGoForward: () => get().currentIndex < get().entries.length - 1,
}));
