import { useEffect, useCallback, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useDocumentStore } from "./stores/documentStore";
import { useUIStore } from "./stores/uiStore";
import { useSearchStore } from "./stores/searchStore";
import { useSettingsStore } from "./stores/settingsStore";
import { useRecentFilesStore } from "./stores/recentFilesStore";
import { RenderedContent } from "./components/RenderedContent";
import { Sidebar } from "./components/sidebar/Sidebar";
import { SearchBar } from "./components/search/SearchBar";
import { HeadingPalette } from "./components/search/HeadingPalette";
import { ProgressBar } from "./components/layout/ProgressBar";
import { HoverToolbar } from "./components/layout/HoverToolbar";
import { ErrorBanner, classifyError } from "./components/reader/ErrorBanner";
import { WelcomeScreen } from "./components/welcome/WelcomeScreen";
import { AppMenu } from "./components/menu/AppMenu";
import { AboutDialog } from "./components/menu/AboutDialog";
import { APP_VERSION } from "./version";
import { parseMarkdown } from "./lib/parser";
import { scrollToHeading } from "./lib/navigation";
import { useTheme } from "./hooks/useTheme";
import { useActiveHeading } from "./hooks/useToc";
import { useSearch } from "./hooks/useSearch";
import { useKeyboard } from "./hooks/useKeyboard";
import { useFileWatcher } from "./hooks/useFileWatcher";
import "./styles/global.css";
import "./styles/fonts.css";
import "./styles/layout.css";
import "./styles/menu.css";
import "./styles/sidebar.css";
import "./styles/search.css";
import "./styles/palette.css";
import "./styles/progress.css";
import "./styles/welcome.css";
import "./styles/about.css";
import "./styles/themes/light.css";
import "./styles/themes/dark.css";
import "./styles/themes/sepia.css";
import "./styles/document.css";

/** File extensions recognised as Markdown (case-insensitive). */
const VALID_EXTENSIONS = new Set([".md", ".markdown"]);

function isMarkdownFile(filePath: string): boolean {
  const dot = filePath.lastIndexOf(".");
  if (dot === -1) return false;
  return VALID_EXTENSIONS.has(filePath.slice(dot).toLowerCase());
}

export default function App() {
  const { parsedResult, filePath, fileName, isLoading, error } = useDocumentStore();
  const {
    sidebarOpen,
    headingPaletteOpen,
    showProgressBar,
    isFocusModeActive,
    toggleSidebar,
    toggleHeadingPalette,
  } = useUIStore();
  const { isOpen: searchOpen, closeSearch } = useSearchStore();
  const { resolvedTheme } = useTheme();

  // Track OS-level fullscreen state; owned here so both menu handler and
  // keyboard hook share the same toggle without querying is_fullscreen().
  const isFullscreenRef = useRef(false);
  const toggleFullscreen = useCallback(() => {
    isFullscreenRef.current = !isFullscreenRef.current;
    void invoke("set_fullscreen", { fullscreen: isFullscreenRef.current })
      .catch((e) => console.error("set_fullscreen failed:", e));
  }, []);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  // Track scroll position for preservation across file-watcher re-renders.
  const savedScrollRef = useRef<number>(0);

  const toc = parsedResult?.toc ?? [];
  const scrollActiveId = useActiveHeading(toc, scrollAreaRef);

  // Immediately highlight the heading the user clicked in the TOC/palette or
  // document, without waiting for the scroll animation to settle.
  const [aboutOpen, setAboutOpen] = useState(false);

  // Cleared after 1.5s — long enough for smooth scroll to finish — so
  // subsequent manual scrolling always reflects the real scroll position.
  // We do NOT clear on scroll-detection match: that fires transiently during
  // the animation and would hand control back too early.
  const [pendingActiveId, setPendingActiveId] = useState<string | null>(null);
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeId = pendingActiveId ?? scrollActiveId;

  const setPending = useCallback((id: string) => {
    if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
    setPendingActiveId(id);
    pendingTimerRef.current = setTimeout(() => {
      setPendingActiveId(null);
      pendingTimerRef.current = null;
    }, 1500);
  }, []);

  // Detect clicks on heading anchors inside the document (e.g. clicking the
  // heading text directly, which has an <a href="#id"> child). The event
  // bubbles up from RenderedContent so we catch it here on the scroll container.
  // Depends on filePath: scrollAreaRef.current is null until a document is
  // loaded and the main render branch mounts the .document-area div.
  useEffect(() => {
    const container = scrollAreaRef.current;
    if (!container) return;
    const handleDocHeadingClick = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest('a[href^="#"]');
      if (!anchor) return;
      const id = anchor.getAttribute("href")?.slice(1);
      if (id) setPending(id);
    };
    container.addEventListener("click", handleDocHeadingClick);
    return () => container.removeEventListener("click", handleDocHeadingClick);
  }, [filePath, setPending]);

  useSearch({ containerRef: contentRef });

  // Watch the currently open file for external edits.
  useFileWatcher(filePath);

  /**
   * Core file-open helper. Parses content, updates all stores, and persists
   * the path. Every code path that opens a file funnels through here.
   */
  const openDocument = useCallback(async (path: string, rawContent: string) => {
    if (!isMarkdownFile(path)) {
      useDocumentStore.getState().setError(`Not a Markdown file: ${path}`);
      return;
    }
    useDocumentStore.getState().setLoading(true);
    try {
      const parsed = await parseMarkdown(rawContent, path);
      const fileNameLocal = path.replace(/\\/g, "/").split("/").pop() ?? path;
      const dirPath = path.replace(/\\/g, "/").split("/").slice(0, -1).join("/");
      useDocumentStore.getState().setDocument(path, fileNameLocal, rawContent, parsed);
      document.title = `${fileNameLocal} — ${dirPath}`;
      await useRecentFilesStore.getState().add(path);
      await useSettingsStore.getState().setLastOpenedFile(path);
      // Restore persisted scroll position for this file (0 if first open).
      const savedPos = useSettingsStore.getState().getScrollPosition(path);
      savedScrollRef.current = savedPos;
      requestAnimationFrame(() => {
        if (scrollAreaRef.current) scrollAreaRef.current.scrollTop = savedPos;
      });
      // Update OS title bar — isolated so a failure never corrupts document state.
      try {
        await getCurrentWindow().setTitle(`${fileNameLocal} — Folio ${APP_VERSION}`);
      } catch {
        // Non-critical: title bar update failed (e.g. restricted in some environments).
      }
    } catch (err) {
      useDocumentStore.getState().setError(String(err));
    }
  }, []);

  /** Open via native file picker. */
  const handleOpenFile = useCallback(async () => {
    try {
      const path: string | null = await invoke("open_file_dialog");
      if (!path) return;
      const content = await invoke<string>("read_file", { path });
      await openDocument(path, content);
    } catch (err) {
      useDocumentStore.getState().setError(String(err));
    }
  }, [openDocument]);

  useKeyboard({ toggleFullscreen, onOpenFile: handleOpenFile });

  // ── Startup sequence ─────────────────────────────────────────────────────
  useEffect(() => {
    async function startup() {
      try {
        // Load persistent data first.
        await Promise.all([
          useRecentFilesStore.getState().loadFromDisk(),
          useSettingsStore.getState().loadFromDisk(),
        ]);

        // 1. CLI argument — highest priority.
        try {
          const cliFile = await invoke<string | null>("get_cli_file");
          if (cliFile) {
            const content = await invoke<string>("read_file", { path: cliFile });
            await openDocument(cliFile, content);
            return;
          }
        } catch (e) {
          console.warn("CLI file open failed:", e);
        }

        // 2. Pending file for this window (set by open_new_window in Rust).
        const windowLabel = getCurrentWindow().label;
        try {
          const pendingFile = await invoke<string | null>("take_pending_file", { label: windowLabel });
          if (pendingFile) {
            const content = await invoke<string>("read_file", { path: pendingFile });
            await openDocument(pendingFile, content);
            return;
          }
        } catch (e) {
          console.warn("Pending file open failed:", e);
        }

        // No file found — welcome screen renders automatically.
      } finally {
        // Reveal the window only after content is ready and React has painted,
        // eliminating the blank-window flash and resize jitter on startup.
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        getCurrentWindow().show();
      }
    }

    void startup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Single-instance: OS "open with" (macOS Finder / Windows Explorer) ────
  useEffect(() => {
    let cancelled = false;
    let unlisten: (() => void) | null = null;
    listen<string>("open-file-request", async (event) => {
      const path = event.payload;
      try {
        const content = await invoke<string>("read_file", { path });
        await openDocument(path, content);
      } catch (e) {
        useDocumentStore.getState().setError(`Could not open: ${e}`);
      }
    }).then((fn) => {
      if (cancelled) fn();
      else unlisten = fn;
    });
    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [openDocument]);

  // ── Drag-drop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    let unlisten: (() => void) | null = null;
    const onDragOver = (e: DragEvent) => e.preventDefault();
    const onDrop = (e: DragEvent) => e.preventDefault();
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);

    listen<{ paths: string[] }>("tauri://drag-drop", (event) => {
      const paths = event.payload.paths;
      if (paths.length > 0) {
        void (async () => {
          try {
            const content = await invoke<string>("read_file", { path: paths[0] });
            await openDocument(paths[0], content);
          } catch (e) {
            useDocumentStore.getState().setError(String(e));
          }
        })();
      }
    }).then((fn) => {
      if (cancelled) fn();
      else unlisten = fn;
    });

    return () => {
      cancelled = true;
      unlisten?.();
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
    };
  }, [openDocument]);

  // ── Scroll position preservation for file-watcher re-renders ─────────────
  // filePath in deps ensures this re-runs after a document opens and the
  // document-area div mounts (scrollAreaRef is null on the welcome screen).
  // Also persists scroll position to disk (debounced inside settingsStore).
  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const onScroll = () => {
      savedScrollRef.current = el.scrollTop;
      if (filePath) {
        useSettingsStore.getState().saveScrollPosition(filePath, el.scrollTop);
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [filePath]);

  // When parsedResult changes due to a file-watcher update (same filePath),
  // restore the saved scroll position after the DOM has updated.
  const prevFilePathRef = useRef<string | null>(null);
  useEffect(() => {
    if (!parsedResult) return;
    const isSameFile = filePath === prevFilePathRef.current;
    prevFilePathRef.current = filePath;

    if (isSameFile && scrollAreaRef.current) {
      // File watcher update — restore scroll.
      const saved = savedScrollRef.current;
      requestAnimationFrame(() => {
        if (scrollAreaRef.current) scrollAreaRef.current.scrollTop = saved;
      });
    }
  }, [parsedResult, filePath]);

  // ── Render ────────────────────────────────────────────────────────────────

  // ── Derive display path for toolbar ─────────────────────────────────────
  const dirPath = filePath
    ? filePath.replace(/\\/g, "/").split("/").slice(0, -1).join("/")
    : null;

  // Single ErrorBanner instance shared across all render branches.
  // Defined here so it is never accidentally duplicated.
  const errorBanner = error ? (
    <ErrorBanner
      type={classifyError(error)}
      path={filePath ?? undefined}
      detail={error}
      onDismiss={() => { useDocumentStore.getState().setError(null); }}
    />
  ) : null;

  // ── Toolbar (always rendered) ─────────────────────────────────────────────
  const toolbar = (
    <div className="app-toolbar">
      <AppMenu onOpenFile={handleOpenFile} toggleFullscreen={toggleFullscreen} onAbout={() => setAboutOpen(true)} />
      <div className="app-toolbar__title">
        {fileName ? (
          <>
            <span className="app-toolbar__filename">{fileName}</span>
            {dirPath && <span className="app-toolbar__path">{dirPath}</span>}
          </>
        ) : (
          <span className="app-toolbar__app-name">Folio {APP_VERSION}</span>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="app-shell">
        {toolbar}
        <div className="app-body">
          <div className="document-area"><p style={{ padding: "2rem" }}>Loading…</p></div>
        </div>
        {aboutOpen && <AboutDialog onClose={() => setAboutOpen(false)} />}
      </div>
    );
  }

  // Error and no document: fall through to WelcomeScreen with the error toast.
  // ErrorBanner renders as a fixed overlay — same pattern as SearchBar/HeadingPalette.

  if (!parsedResult) {
    return (
      <div className="app-shell">
        {toolbar}
        <div className="app-body">
          <div className="document-area">
            <WelcomeScreen onOpen={(path, content) => { void openDocument(path, content); }} />
          </div>
        </div>
        {errorBanner}
        {aboutOpen && <AboutDialog onClose={() => setAboutOpen(false)} />}
      </div>
    );
  }

  return (
    <div className="app-shell">
      {toolbar}
      {showProgressBar && <ProgressBar scrollContainerRef={scrollAreaRef} />}

      {/* Hover-reveal toolbar at the top of the window */}
      <HoverToolbar />

      <div className="app-body">
        <Sidebar
          toc={toc}
          isOpen={sidebarOpen}
          activeId={activeId}
          onToggle={toggleSidebar}
          onSelect={(id) => { setPending(id); scrollToHeading(id); }}
        />

        <div
          ref={scrollAreaRef}
          className={`document-area${sidebarOpen ? " document-area--sidebar-open" : ""}${isFocusModeActive ? " document-area--focus-mode" : ""}`}
        >
          {/* key={filePath} forces remount on each new file, replaying the
              document-enter animation without replaying on file-watcher updates */}
          <RenderedContent
            key={filePath}
            ref={contentRef}
            html={parsedResult.html}
            theme={resolvedTheme()}
          />
        </div>
      </div>

      {searchOpen && <SearchBar onClose={closeSearch} />}

      {headingPaletteOpen && (
        <HeadingPalette
          toc={toc}
          onSelect={(id) => { setPending(id); scrollToHeading(id); }}
          onClose={toggleHeadingPalette}
        />
      )}

      {/* Error toast — dismissible, role="alert" for screen readers */}
      {errorBanner}
      {aboutOpen && <AboutDialog onClose={() => setAboutOpen(false)} />}
    </div>
  );
}

