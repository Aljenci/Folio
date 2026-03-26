import { useEffect } from "react";
import type { TocEntry } from "../../lib/parser/rehype-extract-toc";
import { TocTree } from "./TocTree";

interface SidebarProps {
  toc: TocEntry[];
  isOpen: boolean;
  activeId: string | null;
  onToggle: () => void;
  onSelect: (id: string) => void;
}

/**
 * TOC sidebar panel.
 * Uses CSS transform animation for GPU-composited slide in/out.
 * Auto-scrolls the active TOC entry into view when activeId changes.
 */
export function Sidebar({ toc, isOpen, activeId, onToggle, onSelect }: SidebarProps) {
  // Scroll the active TOC link into view whenever it changes.
  useEffect(() => {
    if (!activeId || !isOpen) return;

    const activeEl = document.querySelector<HTMLElement>(
      `.toc-link[data-id="${activeId}"]`,
    );
    // block: 'nearest' only scrolls if the element is not already visible.
    activeEl?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeId, isOpen]);

  return (
    <aside
      className={`toc-sidebar${isOpen ? " toc-sidebar--open" : " toc-sidebar--closed"}`}
      role="complementary"
      aria-label="Table of contents"
      aria-hidden={!isOpen}
    >
      <div className="toc-header">
        <p className="toc-title">Contents</p>
        <button
          className="toc-close"
          onClick={onToggle}
          aria-label="Close table of contents"
        >
          ✕
        </button>
      </div>

      {toc.length === 0 ? (
        <p className="toc-empty">No headings found</p>
      ) : (
        <TocTree entries={toc} activeId={activeId} onSelect={onSelect} />
      )}
    </aside>
  );
}
