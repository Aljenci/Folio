import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "../uiStore";

describe("uiStore", () => {
  beforeEach(() => {
    useUIStore.setState({
      theme: "light",
      fontSize: 16,
      lineWidth: 80,
      sidebarOpen: false,
      headingPaletteOpen: false,
      showProgressBar: true,
      isFocusModeActive: false,
    });
  });

  it("has correct initial state", () => {
    const s = useUIStore.getState();
    expect(s.theme).toBe("light");
    expect(s.fontSize).toBe(16);
    expect(s.lineWidth).toBe(80);
    expect(s.sidebarOpen).toBe(false);
    expect(s.headingPaletteOpen).toBe(false);
    expect(s.showProgressBar).toBe(true);
    expect(s.isFocusModeActive).toBe(false);
  });

  it("setTheme changes the theme", () => {
    useUIStore.getState().setTheme("dark");
    expect(useUIStore.getState().theme).toBe("dark");

    useUIStore.getState().setTheme("sepia");
    expect(useUIStore.getState().theme).toBe("sepia");
  });

  it("setFontSize updates fontSize", () => {
    useUIStore.getState().setFontSize(20);
    expect(useUIStore.getState().fontSize).toBe(20);
  });

  it("setLineWidth updates lineWidth", () => {
    useUIStore.getState().setLineWidth(70);
    expect(useUIStore.getState().lineWidth).toBe(70);
  });

  it("toggleSidebar flips sidebarOpen", () => {
    expect(useUIStore.getState().sidebarOpen).toBe(false);
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(true);
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(false);
  });

  it("toggleHeadingPalette flips headingPaletteOpen", () => {
    expect(useUIStore.getState().headingPaletteOpen).toBe(false);
    useUIStore.getState().toggleHeadingPalette();
    expect(useUIStore.getState().headingPaletteOpen).toBe(true);
    useUIStore.getState().toggleHeadingPalette();
    expect(useUIStore.getState().headingPaletteOpen).toBe(false);
  });

  it("setShowProgressBar updates the flag", () => {
    useUIStore.getState().setShowProgressBar(false);
    expect(useUIStore.getState().showProgressBar).toBe(false);

    useUIStore.getState().setShowProgressBar(true);
    expect(useUIStore.getState().showProgressBar).toBe(true);
  });

  it("toggleFocusMode flips isFocusModeActive", () => {
    expect(useUIStore.getState().isFocusModeActive).toBe(false);
    useUIStore.getState().toggleFocusMode();
    expect(useUIStore.getState().isFocusModeActive).toBe(true);
    useUIStore.getState().toggleFocusMode();
    expect(useUIStore.getState().isFocusModeActive).toBe(false);
  });
});
