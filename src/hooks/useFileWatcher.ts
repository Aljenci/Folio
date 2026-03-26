import { useEffect, useRef } from "react";
import { watch } from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";
import { parseMarkdown } from "../lib/parser";
import { useDocumentStore } from "../stores/documentStore";

/**
 * Watches the currently open file for external changes and re-renders
 * the document automatically when the file is saved by an external editor.
 *
 * Features:
 * - 100ms debounce to coalesce burst events (e.g. vim safe-write emits 2–4 events)
 * - 150ms retry guard for editors that briefly empty the file before rewriting
 * - Stops watching and starts a new watcher whenever currentPath changes
 */
export function useFileWatcher(currentPath: string | null) {
  const stopWatchingRef = useRef<(() => void | Promise<void>) | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clean up any previous watcher before starting a new one.
    const cleanup = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (stopWatchingRef.current) {
        void stopWatchingRef.current();
        stopWatchingRef.current = null;
      }
    };

    if (!currentPath) {
      cleanup();
      return;
    }

    let isActive = true;

    const startWatching = async () => {
      cleanup();
      if (!isActive) return;

      const tryReload = async () => {
        if (!isActive || !currentPath) return;
        try {
          const content = await invoke<string>("read_file", { path: currentPath });
          const result = await parseMarkdown(content, currentPath);
          if (isActive) {
            useDocumentStore.getState().updateDocument(result);
          }
        } catch {
          // The file may be momentarily empty during a safe-write (temp rename).
          // Retry once after 150ms to let the write complete.
          setTimeout(async () => {
            if (!isActive) return;
            try {
              const content = await invoke<string>("read_file", { path: currentPath });
              const result = await parseMarkdown(content, currentPath);
              if (isActive) {
                useDocumentStore.getState().updateDocument(result);
              }
            } catch (e) {
              console.warn("File watcher retry failed:", e);
            }
          }, 150);
        }
      };

      try {
        const stopFn = await watch(
          currentPath,
          (_event) => {
            // Coalesce rapid events with a 100ms debounce.
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = setTimeout(() => {
              void tryReload();
            }, 100);
          },
          { recursive: false }
        );

        stopWatchingRef.current = stopFn;
      } catch (e) {
        // Watch may fail if the file is outside the allowed scope in production.
        // This is non-fatal — the document is open, file-watching just won't work.
        console.warn("[Folio] File watcher could not start:", e);
      }
    };

    void startWatching();

    return () => {
      isActive = false;
      cleanup();
    };
  }, [currentPath]);
}
