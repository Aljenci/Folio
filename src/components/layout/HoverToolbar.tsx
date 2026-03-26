import { useState, useRef, useCallback } from "react";
import { useSettingsStore } from "../../stores/settingsStore";
import { useUIStore } from "../../stores/uiStore";

/**
 * Hover-reveal floating toolbar.
 *
 * An invisible trigger zone spans the top of the window. When the mouse
 * enters it, a compact toolbar fades in. A 600 ms hide delay prevents the
 * toolbar from vanishing before the user can reach it.
 *
 * The toolbar is removed from the accessibility tree (aria-hidden) when
 * invisible so keyboard users cannot accidentally Tab into it.
 */
export function HoverToolbar() {
  const [isVisible, setIsVisible] = useState(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { theme, setTheme } = useSettingsStore();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  const cycleTheme = useCallback(() => {
    const order = ["light", "sepia", "dark", "auto"] as const;
    const current = order.indexOf(theme as typeof order[number]);
    const next = order[(current + 1) % order.length];
    setTheme(next);
  }, [theme, setTheme]);

  const show = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsVisible(true);
  }, []);

  const scheduleHide = useCallback(() => {
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 600);
  }, []);

  const themeLabel =
    theme === "dark" ? "🌙" : theme === "sepia" ? "📜" : theme === "auto" ? "🔄" : "☀️";

  return (
    <>
      {/* Invisible trigger zone — mouse entry reveals the toolbar */}
      <div
        className="hover-trigger"
        onMouseEnter={show}
        onMouseLeave={scheduleHide}
        aria-hidden="true"
      />

      <div
        className={`hover-toolbar${isVisible ? " hover-toolbar--visible" : ""}`}
        onMouseEnter={show}
        onMouseLeave={scheduleHide}
        role="toolbar"
        aria-label="Document controls"
        aria-hidden={!isVisible}
      >
        <button
          className="toolbar-btn"
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? "Hide table of contents" : "Show table of contents"}
          aria-pressed={sidebarOpen}
          title={sidebarOpen ? "Hide contents (⌘⇧T)" : "Show contents (⌘⇧T)"}
          tabIndex={isVisible ? 0 : -1}
        >
          ☰
        </button>

        <button
          className="toolbar-btn"
          onClick={cycleTheme}
          aria-label={`Switch theme. Current theme: ${theme}`}
          title="Change theme"
          tabIndex={isVisible ? 0 : -1}
        >
          {themeLabel}
        </button>
      </div>
    </>
  );
}
