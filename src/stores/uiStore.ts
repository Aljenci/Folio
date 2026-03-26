import { create } from "zustand";

export type Theme = "light" | "dark" | "sepia";

interface UIState {
  theme: Theme;
  /** Base font size in pixels (default: 16). */
  fontSize: number;
  /** Reading line-width in characters (default: 80). */
  lineWidth: number;

  /** Whether the TOC sidebar is visible. */
  sidebarOpen: boolean;
  /** Whether the heading command palette is open. */
  headingPaletteOpen: boolean;
  /** Whether the reading progress bar is shown. */
  showProgressBar: boolean;
  /** Whether focus mode (gradient vignette on document edges) is active. */
  isFocusModeActive: boolean;

  setTheme: (theme: Theme) => void;
  setFontSize: (size: number) => void;
  setLineWidth: (width: number) => void;
  toggleSidebar: () => void;
  toggleHeadingPalette: () => void;
  setShowProgressBar: (show: boolean) => void;
  toggleFocusMode: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: "light",
  fontSize: 16,
  lineWidth: 80,
  sidebarOpen: false,
  headingPaletteOpen: false,
  showProgressBar: true,
  isFocusModeActive: false,

  setTheme: (theme) => set({ theme }),
  setFontSize: (fontSize) => set({ fontSize }),
  setLineWidth: (lineWidth) => set({ lineWidth }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleHeadingPalette: () => set((s) => ({ headingPaletteOpen: !s.headingPaletteOpen })),
  setShowProgressBar: (showProgressBar) => set({ showProgressBar }),
  toggleFocusMode: () => set((s) => ({ isFocusModeActive: !s.isFocusModeActive })),
}));
