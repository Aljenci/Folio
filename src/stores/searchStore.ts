import { create } from "zustand";

interface SearchState {
  isOpen: boolean;
  query: string;
  matchCount: number;
  /** Index of the currently focused match. -1 means no active match. */
  currentMatch: number;

  openSearch: () => void;
  closeSearch: () => void;
  setQuery: (q: string) => void;
  setMatchCount: (n: number) => void;
  setCurrentMatch: (n: number) => void;
  nextMatch: () => void;
  prevMatch: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  isOpen: false,
  query: "",
  matchCount: 0,
  currentMatch: -1,

  openSearch: () => set({ isOpen: true }),
  closeSearch: () => set({ isOpen: false, query: "", matchCount: 0, currentMatch: -1 }),

  setQuery: (query) => set({ query }),
  setMatchCount: (matchCount) => set({ matchCount }),
  setCurrentMatch: (currentMatch) => set({ currentMatch }),

  nextMatch: () => {
    const { currentMatch, matchCount } = get();
    if (matchCount === 0) return;
    // Wrap from last match back to first.
    set({ currentMatch: (currentMatch + 1) % matchCount });
  },

  prevMatch: () => {
    const { currentMatch, matchCount } = get();
    if (matchCount === 0) return;
    // Wrap from first match to last (add matchCount before % to avoid negative modulo).
    set({ currentMatch: (currentMatch - 1 + matchCount) % matchCount });
  },
}));
