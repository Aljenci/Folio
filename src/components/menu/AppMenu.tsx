import { useState, useRef, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useSettingsStore, FONT_OPTIONS, type LineSpacing, type ColumnWidth, type FontId } from "../../stores/settingsStore";
import { useUIStore } from "../../stores/uiStore";
import { useSearchStore } from "../../stores/searchStore";

interface Props {
  onOpenFile: () => void;
  toggleFullscreen: () => void;
  onAbout: () => void;
}

interface MenuAction {
  kind: "action";
  label: string;
  shortcut?: string;
  action: () => void;
  activeWhen?: () => boolean;
}
interface MenuSep   { kind: "separator" }
interface MenuGroup { kind: "group"; label: string }
type Item = MenuAction | MenuSep | MenuGroup;

export function AppMenu({ onOpenFile, toggleFullscreen, onAbout }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onMouse = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onMouse);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onMouse);
    };
  }, [open]);

  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

  const theme = useSettingsStore((s) => s.theme);
  const lineSpacing = useSettingsStore((s) => s.lineSpacing);
  const columnWidth = useSettingsStore((s) => s.columnWidth);
  const font = useSettingsStore((s) => s.font);
  const isFocusModeActive = useUIStore((s) => s.isFocusModeActive);

  const items: Item[] = [
    { kind: "group", label: "File" },
    {
      kind: "action", label: "Open File…", shortcut: "Ctrl+O",
      action: () => onOpenFile(),
    },
    {
      kind: "action", label: "New Window", shortcut: "Ctrl+N",
      action: () => void invoke("open_new_window", { path: null }),
    },
    { kind: "separator" },
    {
      kind: "action", label: "Print…", shortcut: "Ctrl+P",
      action: () => window.print(),
    },
    { kind: "separator" },
    {
      kind: "action", label: "Close Window",
      action: () => void getCurrentWindow().close(),
    },

    { kind: "separator" },
    { kind: "group", label: "View" },
    {
      kind: "action", label: "Toggle Sidebar", shortcut: "Ctrl+⇧+T",
      action: () => useUIStore.getState().toggleSidebar(),
    },
    {
      kind: "action", label: "Focus Mode", shortcut: "F",
      action: () => useUIStore.getState().toggleFocusMode(),
      activeWhen: () => isFocusModeActive,
    },
    { kind: "separator" },
    {
      kind: "action", label: "Light Theme",
      action: () => useSettingsStore.getState().setTheme("light"),
      activeWhen: () => theme === "light",
    },
    {
      kind: "action", label: "Dark Theme",
      action: () => useSettingsStore.getState().setTheme("dark"),
      activeWhen: () => theme === "dark",
    },
    {
      kind: "action", label: "Sepia Theme",
      action: () => useSettingsStore.getState().setTheme("sepia"),
      activeWhen: () => theme === "sepia",
    },
    { kind: "separator" },
    { kind: "group", label: "Line Spacing" },
    {
      kind: "action", label: "Compact",
      action: () => useSettingsStore.getState().setLineSpacing("compact" as LineSpacing),
      activeWhen: () => lineSpacing === "compact",
    },
    {
      kind: "action", label: "Normal",
      action: () => useSettingsStore.getState().setLineSpacing("normal" as LineSpacing),
      activeWhen: () => lineSpacing === "normal",
    },
    {
      kind: "action", label: "Relaxed",
      action: () => useSettingsStore.getState().setLineSpacing("relaxed" as LineSpacing),
      activeWhen: () => lineSpacing === "relaxed",
    },
    { kind: "separator" },
    { kind: "group", label: "Column Width" },
    {
      kind: "action", label: "Narrow (55ch)",
      action: () => useSettingsStore.getState().setColumnWidth("narrow" as ColumnWidth),
      activeWhen: () => columnWidth === "narrow",
    },
    {
      kind: "action", label: "Medium (68ch)",
      action: () => useSettingsStore.getState().setColumnWidth("medium" as ColumnWidth),
      activeWhen: () => columnWidth === "medium",
    },
    {
      kind: "action", label: "Wide (85ch)",
      action: () => useSettingsStore.getState().setColumnWidth("wide" as ColumnWidth),
      activeWhen: () => columnWidth === "wide",
    },
    { kind: "separator" },
    { kind: "group", label: "Font" },
    ...FONT_OPTIONS.map((f) => ({
      kind: "action" as const,
      label: f.name,
      action: () => useSettingsStore.getState().setFont(f.id as FontId),
      activeWhen: () => font === f.id,
    })),
    { kind: "separator" },
    {
      kind: "action", label: "Zoom In",  shortcut: "Ctrl++",
      action: () => useSettingsStore.getState().zoomIn(),
    },
    {
      kind: "action", label: "Zoom Out", shortcut: "Ctrl+−",
      action: () => useSettingsStore.getState().zoomOut(),
    },
    {
      kind: "action", label: "Reset Zoom", shortcut: "Ctrl+0",
      action: () => useSettingsStore.getState().resetZoom(),
    },
    { kind: "separator" },
    {
      kind: "action", label: "Full Screen", shortcut: "F11",
      action: () => toggleFullscreen(),
    },

    { kind: "separator" },
    { kind: "group", label: "Find" },
    {
      kind: "action", label: "Search…", shortcut: "Ctrl+F",
      action: () => useSearchStore.getState().openSearch(),
    },
    {
      kind: "action", label: "Go to Heading…", shortcut: "Ctrl+G",
      action: () => useUIStore.getState().toggleHeadingPalette(),
    },

    { kind: "separator" },
    { kind: "group", label: "Help" },
    {
      kind: "action", label: "About Folio…",
      action: () => onAbout(),
    },
  ];

  return (
    <div className="app-menu" ref={rootRef}>
      <button
        className={`app-menu__trigger${open ? " app-menu__trigger--open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Open menu"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <HamburgerIcon />
      </button>

      {open && (
        <ul className="app-menu__dropdown" role="menu">
          {items.map((item, i) => {
            if (item.kind === "separator") {
              return <li key={i} className="app-menu__sep" role="separator" />;
            }
            if (item.kind === "group") {
              return (
                <li key={i} className="app-menu__group" role="presentation">
                  {item.label}
                </li>
              );
            }
            const active = item.activeWhen?.() ?? false;
            return (
              <li key={i} role="menuitem">
                <button
                  className={`app-menu__item${active ? " app-menu__item--active" : ""}`}
                  onClick={() => run(item.action)}
                >
                  <span className="app-menu__item-label">
                    {active && <span className="app-menu__check">✓</span>}
                    {item.label}
                  </span>
                  {item.shortcut && (
                    <span className="app-menu__shortcut">{item.shortcut}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function HamburgerIcon() {
  return (
    <svg
      width="15" height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="1" y="3"   width="13" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="1" y="6.75" width="13" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="1" y="10.5" width="13" height="1.5" rx="0.75" fill="currentColor" />
    </svg>
  );
}
