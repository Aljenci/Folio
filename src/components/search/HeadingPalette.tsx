import { useState, useEffect, useRef, useMemo } from "react";
import type { TocEntry } from "../../lib/parser/rehype-extract-toc";
import { useFocusTrap } from "../../hooks/useFocusTrap";

interface HeadingPaletteProps {
  toc: TocEntry[];
  onSelect: (id: string) => void;
  onClose: () => void;
}

function flattenToc(entries: TocEntry[]): TocEntry[] {
  return entries.flatMap((e) => [e, ...flattenToc(e.children)]);
}

/**
 * Keyboard-driven heading navigator (Cmd/Ctrl+G).
 * Type to filter headings by text; Arrow keys navigate; Enter jumps; Escape closes.
 *
 * Accessibility:
 * - role="dialog" with aria-modal="true" marks this as a modal for screen readers.
 * - A sr-only hint element describes keyboard usage without cluttering the screen.
 * - useFocusTrap keeps Tab focus within the dialog while it is open.
 * - Focus returns to the element that triggered the dialog on close.
 */
export function HeadingPalette({ toc, onSelect, onClose }: HeadingPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  // Capture the element that had focus when the dialog opened so we can
  // restore it when the dialog closes.
  useEffect(() => {
    returnFocusRef.current = document.activeElement as HTMLElement;
  }, []);

  useFocusTrap(containerRef, true, returnFocusRef.current);

  const allHeadings = useMemo(() => flattenToc(toc), [toc]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allHeadings;
    return allHeadings.filter((h) => h.text.toLowerCase().includes(q));
  }, [query, allHeadings]);

  // Reset selection to first result whenever the filtered list changes.
  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered]);

  // Scroll selected list item into view.
  useEffect(() => {
    const item = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        if (filtered[selectedIndex]) {
          onSelect(filtered[selectedIndex].id);
          onClose();
        }
        break;
      case "Escape":
        onClose();
        break;
    }
  };

  return (
    <>
      {/* Transparent backdrop — clicking outside closes the palette */}
      <div className="palette-backdrop" onClick={onClose} aria-hidden="true" />

      <div
        ref={containerRef}
        className="heading-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Go to heading"
        aria-describedby="palette-hint"
      >
        {/* Screen-reader-only instructions — invisible on screen */}
        <p id="palette-hint" className="sr-only">
          Type to filter headings. Arrow keys to navigate, Enter to select, Escape to close.
        </p>

        <input
          ref={inputRef}
          type="text"
          className="palette-input"
          placeholder="Go to heading…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Filter headings"
          aria-controls="palette-list"
          aria-activedescendant={filtered[selectedIndex] ? `palette-item-${filtered[selectedIndex].id}` : undefined}
        />

        <ul
          ref={listRef}
          id="palette-list"
          className="palette-list"
          role="listbox"
          aria-label="Headings"
        >
          {filtered.length === 0 && (
            <li className="palette-empty" role="option" aria-selected={false}>
              No matching headings
            </li>
          )}
          {filtered.map((h, i) => (
            <li
              key={h.id}
              id={`palette-item-${h.id}`}
              role="option"
              aria-selected={i === selectedIndex}
              className={`palette-item${i === selectedIndex ? " palette-item--selected" : ""}`}
              style={{ paddingLeft: `${h.depth * 12 + 12}px` }}
              onClick={() => {
                onSelect(h.id);
                onClose();
              }}
            >
              <span className="palette-item__depth">H{h.depth}</span>
              <span className="palette-item__text">{h.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
