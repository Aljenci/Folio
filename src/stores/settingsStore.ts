import { Store } from "@tauri-apps/plugin-store";
import { create } from "zustand";

export type LineSpacing = "compact" | "normal" | "relaxed";
export type ColumnWidth = "narrow" | "medium" | "wide";
export type FontId = "lora" | "source-serif-4" | "inter" | "opendyslexic" | "jetbrains-mono";

export const LINE_HEIGHT_VALUES: Record<LineSpacing, string> = {
  compact: "1.5",
  normal: "1.75",
  relaxed: "2.1",
};

export const COLUMN_WIDTH_VALUES: Record<ColumnWidth, string> = {
  narrow: "55ch",
  medium: "68ch",
  wide: "85ch",
};

export const FONT_OPTIONS: { id: FontId; name: string; stack: string; description: string }[] = [
  { id: "lora", name: "Lora", stack: "'Lora Variable', Georgia, serif", description: "Elegant serif — the default" },
  { id: "source-serif-4", name: "Source Serif 4", stack: "'Source Serif 4 Variable', Georgia, serif", description: "Neutral serif — clean and readable" },
  { id: "inter", name: "Inter", stack: "'Inter Variable', system-ui, sans-serif", description: "Modern sans-serif" },
  { id: "opendyslexic", name: "OpenDyslexic", stack: "'OpenDyslexic', sans-serif", description: "Designed for dyslexic readers" },
  { id: "jetbrains-mono", name: "JetBrains Mono", stack: "'JetBrains Mono Variable', ui-monospace, monospace", description: "Monospace — built for coders" },
];

export type Theme = "light" | "dark" | "sepia" | "auto";

// Lazy singleton — Store.load() is async so we initialize on first use.
// Shared file with recentFilesStore; different keys, same JSON file on disk.
let _diskStore: Store | null = null;
async function getStore(): Promise<Store> {
  if (!_diskStore) _diskStore = await Store.load("folio-settings.json");
  return _diskStore;
}

const THEME_KEY = "theme";
const ZOOM_KEY = "zoom_index";
const LAST_FILE_KEY = "last_opened_file";
const SCROLL_KEY = "scroll_positions";
const LINE_SPACING_KEY = "line_spacing";
const COLUMN_WIDTH_KEY = "column_width";
const FONT_KEY = "font";

/** Discrete zoom levels as percentages of the 18px base size. */
export const ZOOM_LEVELS = [70, 80, 90, 100, 110, 120, 140, 160] as const;
const DEFAULT_ZOOM_INDEX = 3; // 100%

// Debounce timer for batching scroll position disk writes (module-level singleton).
let scrollSaveTimer: ReturnType<typeof setTimeout> | null = null;

interface SettingsState {
  /** Active theme. 'auto' follows the OS preference. */
  theme: Theme;
  /** Index into ZOOM_LEVELS array (0-7). Default 3 = 100%. */
  zoomIndex: number;
  /** Per-file scroll positions: { absoluteFilePath → scrollY }. */
  scrollPosition: Record<string, number>;
  /** Last successfully opened file path (null if none). */
  lastOpenedFile: string | null;
  /** Reading line spacing preset. */
  lineSpacing: LineSpacing;
  /** Document column width preset. */
  columnWidth: ColumnWidth;
  /** Active body font. */
  font: FontId;

  setTheme: (theme: Theme) => void;
  setZoomIndex: (index: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  saveScrollPosition: (filePath: string, position: number) => void;
  getScrollPosition: (filePath: string) => number;
  setLastOpenedFile: (path: string | null) => Promise<void>;
  setLineSpacing: (spacing: LineSpacing) => void;
  setColumnWidth: (width: ColumnWidth) => void;
  setFont: (font: FontId) => void;
  loadFromDisk: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: "auto",
  zoomIndex: DEFAULT_ZOOM_INDEX,
  scrollPosition: {},
  lastOpenedFile: null,
  lineSpacing: "normal",
  columnWidth: "medium",
  font: "lora",

  setTheme: (theme) => {
    set({ theme });
    void getStore().then((s) => s.set(THEME_KEY, theme).then(() => s.save()));
  },

  setZoomIndex: (zoomIndex) => {
    set({ zoomIndex });
    void getStore().then((s) => s.set(ZOOM_KEY, zoomIndex).then(() => s.save()));
  },

  zoomIn: () => {
    const next = Math.min(get().zoomIndex + 1, ZOOM_LEVELS.length - 1);
    get().setZoomIndex(next);
  },

  zoomOut: () => {
    const next = Math.max(get().zoomIndex - 1, 0);
    get().setZoomIndex(next);
  },

  resetZoom: () => {
    get().setZoomIndex(DEFAULT_ZOOM_INDEX);
  },

  saveScrollPosition: (filePath, position) => {
    set((state) => ({
      scrollPosition: { ...state.scrollPosition, [filePath]: position },
    }));
    // Debounce disk writes so rapid scroll events don't hammer the store.
    if (scrollSaveTimer) clearTimeout(scrollSaveTimer);
    scrollSaveTimer = setTimeout(() => {
      const positions = useSettingsStore.getState().scrollPosition;
      void getStore().then((s) =>
        s.set(SCROLL_KEY, positions).then(() => s.save())
      );
    }, 500);
  },

  getScrollPosition: (filePath) => get().scrollPosition[filePath] ?? 0,

  setLastOpenedFile: async (path) => {
    set({ lastOpenedFile: path });
    const store = await getStore();
    if (path === null) {
      await store.delete(LAST_FILE_KEY);
    } else {
      await store.set(LAST_FILE_KEY, path);
    }
    await store.save();
  },

  setLineSpacing: (lineSpacing) => {
    set({ lineSpacing });
    document.documentElement.style.setProperty("--line-height", LINE_HEIGHT_VALUES[lineSpacing]);
    void getStore().then((s) => s.set(LINE_SPACING_KEY, lineSpacing).then(() => s.save()));
  },

  setColumnWidth: (columnWidth) => {
    set({ columnWidth });
    document.documentElement.style.setProperty("--measure", COLUMN_WIDTH_VALUES[columnWidth]);
    void getStore().then((s) => s.set(COLUMN_WIDTH_KEY, columnWidth).then(() => s.save()));
  },

  setFont: (font) => {
    const option = FONT_OPTIONS.find((f) => f.id === font);
    set({ font });
    if (option) {
      document.documentElement.style.setProperty("--font-body", option.stack);
    }
    void getStore().then((s) => s.set(FONT_KEY, font).then(() => s.save()));
  },

  loadFromDisk: async () => {
    try {
      const store = await getStore();
      const theme = await store.get<Theme>(THEME_KEY);
      const zoomIndex = await store.get<number>(ZOOM_KEY);
      const lastOpenedFile = await store.get<string>(LAST_FILE_KEY);
      const scrollPosition = await store.get<Record<string, number>>(SCROLL_KEY);
      const lineSpacing = await store.get<LineSpacing>(LINE_SPACING_KEY);
      const columnWidth = await store.get<ColumnWidth>(COLUMN_WIDTH_KEY);
      const font = await store.get<FontId>(FONT_KEY);

      const resolvedLineSpacing: LineSpacing = lineSpacing ?? "normal";
      const resolvedColumnWidth: ColumnWidth = columnWidth ?? "medium";
      const resolvedFont: FontId = font ?? "lora";
      const fontOption = FONT_OPTIONS.find((f) => f.id === resolvedFont);

      // Apply typography CSS properties synchronously before first paint.
      document.documentElement.style.setProperty("--line-height", LINE_HEIGHT_VALUES[resolvedLineSpacing]);
      document.documentElement.style.setProperty("--measure", COLUMN_WIDTH_VALUES[resolvedColumnWidth]);
      if (fontOption) {
        document.documentElement.style.setProperty("--font-body", fontOption.stack);
      }

      set({
        theme: theme ?? "auto",
        zoomIndex: zoomIndex ?? DEFAULT_ZOOM_INDEX,
        lastOpenedFile: lastOpenedFile ?? null,
        scrollPosition: scrollPosition ?? {},
        lineSpacing: resolvedLineSpacing,
        columnWidth: resolvedColumnWidth,
        font: resolvedFont,
      });
    } catch (e) {
      console.warn("Settings store corrupted, resetting to defaults:", e);
      try {
        const store = await getStore();
        await store.delete(THEME_KEY);
        await store.delete(ZOOM_KEY);
        await store.delete(LAST_FILE_KEY);
        await store.delete(SCROLL_KEY);
        await store.delete(LINE_SPACING_KEY);
        await store.delete(COLUMN_WIDTH_KEY);
        await store.delete(FONT_KEY);
        await store.save();
      } catch {
        // Ignore secondary errors during recovery
      }
      set({ theme: "auto", zoomIndex: DEFAULT_ZOOM_INDEX, lastOpenedFile: null });
    }
  },
}));

