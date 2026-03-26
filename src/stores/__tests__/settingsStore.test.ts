import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  useSettingsStore,
  ZOOM_LEVELS,
  LINE_HEIGHT_VALUES,
  COLUMN_WIDTH_VALUES,
  FONT_OPTIONS,
} from "../settingsStore";

describe("settingsStore — pure state logic", () => {
  beforeEach(() => {
    useSettingsStore.setState({
      theme: "auto",
      zoomIndex: 3,
      scrollPosition: {},
      lastOpenedFile: null,
      lineSpacing: "normal",
      columnWidth: "medium",
      font: "lora",
    });
    // Reset CSS custom properties between tests
    document.documentElement.style.cssText = "";
  });

  it("has correct initial state", () => {
    const s = useSettingsStore.getState();
    expect(s.theme).toBe("auto");
    expect(s.zoomIndex).toBe(3);
    expect(s.scrollPosition).toEqual({});
    expect(s.lastOpenedFile).toBeNull();
    expect(s.lineSpacing).toBe("normal");
    expect(s.columnWidth).toBe("medium");
    expect(s.font).toBe("lora");
  });

  it("ZOOM_LEVELS has 8 discrete levels", () => {
    expect(ZOOM_LEVELS).toHaveLength(8);
    expect(ZOOM_LEVELS[0]).toBe(70);
    expect(ZOOM_LEVELS[ZOOM_LEVELS.length - 1]).toBe(160);
  });

  it("LINE_HEIGHT_VALUES covers all spacing presets", () => {
    expect(LINE_HEIGHT_VALUES.compact).toBe("1.5");
    expect(LINE_HEIGHT_VALUES.normal).toBe("1.75");
    expect(LINE_HEIGHT_VALUES.relaxed).toBe("2.1");
  });

  it("COLUMN_WIDTH_VALUES covers all column presets", () => {
    expect(COLUMN_WIDTH_VALUES.narrow).toBe("55ch");
    expect(COLUMN_WIDTH_VALUES.medium).toBe("68ch");
    expect(COLUMN_WIDTH_VALUES.wide).toBe("85ch");
  });

  it("FONT_OPTIONS includes at least 5 font choices", () => {
    expect(FONT_OPTIONS.length).toBeGreaterThanOrEqual(5);
    const ids = FONT_OPTIONS.map((f) => f.id);
    expect(ids).toContain("lora");
    expect(ids).toContain("inter");
    expect(ids).toContain("jetbrains-mono");
  });

  it("setTheme updates the theme in state", () => {
    useSettingsStore.getState().setTheme("dark");
    expect(useSettingsStore.getState().theme).toBe("dark");

    useSettingsStore.getState().setTheme("sepia");
    expect(useSettingsStore.getState().theme).toBe("sepia");

    useSettingsStore.getState().setTheme("auto");
    expect(useSettingsStore.getState().theme).toBe("auto");
  });

  it("setZoomIndex updates zoomIndex in state", () => {
    useSettingsStore.getState().setZoomIndex(5);
    expect(useSettingsStore.getState().zoomIndex).toBe(5);
  });

  it("zoomIn increments zoomIndex", () => {
    useSettingsStore.setState({ zoomIndex: 3 });
    useSettingsStore.getState().zoomIn();
    expect(useSettingsStore.getState().zoomIndex).toBe(4);
  });

  it("zoomIn does not exceed the maximum index", () => {
    useSettingsStore.setState({ zoomIndex: ZOOM_LEVELS.length - 1 });
    useSettingsStore.getState().zoomIn();
    expect(useSettingsStore.getState().zoomIndex).toBe(ZOOM_LEVELS.length - 1);
  });

  it("zoomOut decrements zoomIndex", () => {
    useSettingsStore.setState({ zoomIndex: 3 });
    useSettingsStore.getState().zoomOut();
    expect(useSettingsStore.getState().zoomIndex).toBe(2);
  });

  it("zoomOut does not go below 0", () => {
    useSettingsStore.setState({ zoomIndex: 0 });
    useSettingsStore.getState().zoomOut();
    expect(useSettingsStore.getState().zoomIndex).toBe(0);
  });

  it("resetZoom returns zoomIndex to 3 (100%)", () => {
    useSettingsStore.setState({ zoomIndex: 7 });
    useSettingsStore.getState().resetZoom();
    expect(useSettingsStore.getState().zoomIndex).toBe(3);
  });

  it("getScrollPosition returns 0 for unknown paths", () => {
    expect(useSettingsStore.getState().getScrollPosition("/unknown.md")).toBe(0);
  });

  it("saveScrollPosition stores and retrieves the position", () => {
    useSettingsStore.getState().saveScrollPosition("/docs/readme.md", 450);
    expect(useSettingsStore.getState().getScrollPosition("/docs/readme.md")).toBe(450);
  });

  it("saveScrollPosition overwrites the previous value", () => {
    useSettingsStore.getState().saveScrollPosition("/docs/readme.md", 100);
    useSettingsStore.getState().saveScrollPosition("/docs/readme.md", 800);
    expect(useSettingsStore.getState().getScrollPosition("/docs/readme.md")).toBe(800);
  });

  it("saves scroll positions independently per file", () => {
    useSettingsStore.getState().saveScrollPosition("/a.md", 100);
    useSettingsStore.getState().saveScrollPosition("/b.md", 200);
    expect(useSettingsStore.getState().getScrollPosition("/a.md")).toBe(100);
    expect(useSettingsStore.getState().getScrollPosition("/b.md")).toBe(200);
  });

  it("setLineSpacing updates lineSpacing in state and sets CSS custom property", () => {
    const spy = vi.spyOn(document.documentElement.style, "setProperty");

    useSettingsStore.getState().setLineSpacing("compact");
    expect(useSettingsStore.getState().lineSpacing).toBe("compact");
    expect(spy).toHaveBeenCalledWith("--line-height", "1.5");

    useSettingsStore.getState().setLineSpacing("relaxed");
    expect(useSettingsStore.getState().lineSpacing).toBe("relaxed");
    expect(spy).toHaveBeenCalledWith("--line-height", "2.1");

    spy.mockRestore();
  });

  it("setColumnWidth updates columnWidth in state and sets CSS custom property", () => {
    const spy = vi.spyOn(document.documentElement.style, "setProperty");

    useSettingsStore.getState().setColumnWidth("wide");
    expect(useSettingsStore.getState().columnWidth).toBe("wide");
    expect(spy).toHaveBeenCalledWith("--measure", "85ch");

    useSettingsStore.getState().setColumnWidth("narrow");
    expect(useSettingsStore.getState().columnWidth).toBe("narrow");
    expect(spy).toHaveBeenCalledWith("--measure", "55ch");

    spy.mockRestore();
  });

  it("setFont updates font in state and sets CSS custom property", () => {
    const spy = vi.spyOn(document.documentElement.style, "setProperty");

    useSettingsStore.getState().setFont("inter");
    expect(useSettingsStore.getState().font).toBe("inter");
    expect(spy).toHaveBeenCalledWith("--font-body", expect.stringContaining("Inter"));

    useSettingsStore.getState().setFont("lora");
    expect(useSettingsStore.getState().font).toBe("lora");
    expect(spy).toHaveBeenCalledWith("--font-body", expect.stringContaining("Lora"));

    spy.mockRestore();
  });

  it("setLastOpenedFile updates lastOpenedFile in state", async () => {
    await useSettingsStore.getState().setLastOpenedFile("/path/to/file.md");
    expect(useSettingsStore.getState().lastOpenedFile).toBe("/path/to/file.md");
  });

  it("setLastOpenedFile(null) clears lastOpenedFile", async () => {
    await useSettingsStore.getState().setLastOpenedFile("/path/to/file.md");
    await useSettingsStore.getState().setLastOpenedFile(null);
    expect(useSettingsStore.getState().lastOpenedFile).toBeNull();
  });

  it("loadFromDisk restores persisted settings", async () => {
    // Pre-populate the mock store with saved settings
    const { Store } = await import("@tauri-apps/plugin-store");
    const store = await Store.load("folio-settings.json");
    await store.set("theme", "dark");
    await store.set("zoom_index", 5);
    await store.set("line_spacing", "relaxed");
    await store.set("column_width", "wide");
    await store.set("font", "inter");

    await useSettingsStore.getState().loadFromDisk();

    const s = useSettingsStore.getState();
    expect(s.theme).toBe("dark");
    expect(s.zoomIndex).toBe(5);
    expect(s.lineSpacing).toBe("relaxed");
    expect(s.columnWidth).toBe("wide");
    expect(s.font).toBe("inter");
  });
});
