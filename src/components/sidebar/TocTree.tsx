import type { TocEntry } from "../../lib/parser/rehype-extract-toc";

interface TocTreeProps {
  entries: TocEntry[];
  activeId: string | null;
  onSelect: (id: string) => void;
  /** Tracks nesting depth for visual indentation (starts at 0). */
  depth?: number;
  /** Flat index offset used for cross-level arrow key navigation. */
  indexOffset?: number;
}

/**
 * Recursive TOC tree component.
 * Each heading is a button; children are rendered as a nested TocTree.
 * Visual indentation is applied via inline paddingLeft (depth is dynamic).
 *
 * Arrow key navigation (ArrowUp/Down) moves focus between all .toc-link
 * elements regardless of nesting depth. Home/End jump to first/last.
 */
export function TocTree({
  entries,
  activeId,
  onSelect,
  depth = 0,
}: TocTreeProps) {
  if (entries.length === 0) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const allLinks = Array.from(
      document.querySelectorAll<HTMLElement>(".toc-link")
    );
    const currentIndex = allLinks.indexOf(e.currentTarget);

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        allLinks[currentIndex + 1]?.focus();
        break;
      case "ArrowUp":
        e.preventDefault();
        allLinks[currentIndex - 1]?.focus();
        break;
      case "Home":
        e.preventDefault();
        allLinks[0]?.focus();
        break;
      case "End":
        e.preventDefault();
        allLinks[allLinks.length - 1]?.focus();
        break;
    }
  };

  return (
    <ul className="toc-list" role="list">
      {entries.map((entry) => (
        <li key={entry.id} className="toc-item">
          <button
            className={`toc-link${entry.id === activeId ? " toc-link--active" : ""}`}
            style={{ paddingLeft: `${(depth + 1) * 14}px` }}
            onClick={() => onSelect(entry.id)}
            onKeyDown={handleKeyDown}
            title={entry.text}
            data-id={entry.id}
            aria-current={entry.id === activeId ? "true" : undefined}
          >
            {entry.text}
          </button>

          {entry.children.length > 0 && (
            <TocTree
              entries={entry.children}
              activeId={activeId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          )}
        </li>
      ))}
    </ul>
  );
}
