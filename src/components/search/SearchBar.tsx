import { useEffect, useRef, useState } from "react";
import { useSearchStore } from "../../stores/searchStore";

interface SearchBarProps {
  onClose: () => void;
}

/**
 * Floating search bar.
 * Auto-focuses on mount. Enter = next match, Shift+Enter = previous match.
 * Escape closes and clears search.
 *
 * The aria-live region is debounced 300 ms so screen readers only announce
 * the final count after the user pauses typing, not every intermediate value.
 */
export function SearchBar({ onClose }: SearchBarProps) {
  const { query, setQuery, matchCount, currentMatch } = useSearchStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [announcedCount, setAnnouncedCount] = useState("");

  // Auto-focus the input when the bar appears.
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  // Escape key closes the bar.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Debounce aria-live announcements to avoid rapid-fire screen reader output.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!query.trim()) {
        setAnnouncedCount("");
      } else {
        setAnnouncedCount(
          matchCount === 0
            ? "No matches"
            : `${currentMatch + 1} of ${matchCount} matches`
        );
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [matchCount, currentMatch, query]);

  return (
    <div className="search-bar" role="search" aria-label="Find in document">
      <input
        ref={inputRef}
        id="search-input"
        type="search"
        className="search-bar__input"
        placeholder="Find in document…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (e.shiftKey) {
              useSearchStore.getState().prevMatch();
            } else {
              useSearchStore.getState().nextMatch();
            }
          }
        }}
        aria-label="Search query"
        aria-controls="search-status"
      />

      {/* aria-live region: debounced so screen readers hear the final count */}
      <span
        id="search-status"
        className="search-bar__count"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcedCount}
      </span>

      <button
        className="search-bar__nav"
        onClick={() => useSearchStore.getState().prevMatch()}
        disabled={matchCount === 0}
        aria-label="Previous match (Shift+Enter)"
      >
        ↑
      </button>

      <button
        className="search-bar__nav"
        onClick={() => useSearchStore.getState().nextMatch()}
        disabled={matchCount === 0}
        aria-label="Next match (Enter)"
      >
        ↓
      </button>

      <button
        className="search-bar__close"
        onClick={onClose}
        aria-label="Close search"
      >
        ✕
      </button>
    </div>
  );
}

