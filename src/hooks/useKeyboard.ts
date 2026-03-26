import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useUIStore } from "../stores/uiStore";
import { useSearchStore } from "../stores/searchStore";
import { useZoom } from "./useZoom";

/**
 * Registers all global keyboard shortcuts for Folio.
 * Called once at the root App level.
 *
 * Centralising here prevents conflicts, duplicate registrations, and
 * makes the shortcut map easy to audit.
 */
export function useKeyboard({ toggleFullscreen, onOpenFile }: { toggleFullscreen: () => void; onOpenFile: () => void }) {
  const { toggleSidebar, toggleHeadingPalette, toggleFocusMode } = useUIStore();
  const { openSearch } = useSearchStore();
  const { zoomIn, zoomOut, resetZoom } = useZoom();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      const shift = e.shiftKey;

      // Always prevent browser defaults for our shortcut keys so the
      // WebView's native find bars and print dialogs never open independently.
      if (meta && shift && (e.key === "T" || e.key === "t")) e.preventDefault();
      if (meta && !shift && (e.key === "f" || e.key === "F")) e.preventDefault();
      if (meta && !shift && (e.key === "g" || e.key === "G")) e.preventDefault();
      if (meta && !shift && (e.key === "o" || e.key === "O")) e.preventDefault();
      if (meta && !shift && (e.key === "p" || e.key === "P")) e.preventDefault();

      // Do not act on shortcuts while the user is typing in an input field.
      const tag = (e.target as HTMLElement).tagName;
      const isTyping = tag === "INPUT" || tag === "TEXTAREA";
      if (isTyping) return;

      if (meta && shift && (e.key === "T" || e.key === "t")) toggleSidebar();
      if (meta && !shift && (e.key === "f" || e.key === "F")) openSearch();
      if (meta && !shift && (e.key === "g" || e.key === "G")) toggleHeadingPalette();
      if (meta && (e.key === "+" || e.key === "=")) { e.preventDefault(); zoomIn(); }
      if (meta && e.key === "-")                    { e.preventDefault(); zoomOut(); }
      if (meta && e.key === "0")                    { e.preventDefault(); resetZoom(); }
      if (meta && !shift && (e.key === "o" || e.key === "O")) {
        onOpenFile();
      }
      // Ctrl+N / Cmd+N: WebView2 intercepts this before the Win32 native-menu
      // accelerator, so the JS keydown handler is the only reliable path for
      // this shortcut. Menu *clicks* on "New Window" are handled entirely in
      // Rust (on_menu_event) and do NOT go through this handler, so there is
      // no double-invoke risk.
      if (meta && !shift && (e.key === "n" || e.key === "N")) {
        void invoke("open_new_window", { path: null });
      }
      if (meta && !shift && (e.key === "p" || e.key === "P")) {
        window.print();
      }
      if (e.key === "F11") {
        e.preventDefault();
        toggleFullscreen();
      }
      // Plain `f` (no modifier) toggles focus mode.
      if (!meta && !shift && e.key === "f") toggleFocusMode();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleSidebar, openSearch, toggleHeadingPalette, toggleFocusMode, zoomIn, zoomOut, resetZoom, toggleFullscreen, onOpenFile]);
}
