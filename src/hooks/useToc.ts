import { useState, useEffect, RefObject } from "react";
import type { TocEntry } from "../lib/parser/rehype-extract-toc";

/** Flatten a nested TocEntry tree into a flat array, preserving document order. */
function flattenToc(entries: TocEntry[]): TocEntry[] {
  return entries.flatMap((entry) => [entry, ...flattenToc(entry.children)]);
}

/**
 * Returns the id of the heading currently in the "active" reading position.
 *
 * Uses a passive scroll listener on the scroll container for reliability.
 * "Active" means the last heading whose top edge is at or above the top
 * 25% of the scroll container — i.e. the heading the reader has most
 * recently scrolled past.
 *
 * Falls back to the first heading when at the top of the document.
 *
 * @param toc             - Nested TOC tree (from ParseResult.toc)
 * @param scrollContainer - Ref to the element that scrolls (.document-area)
 */
export function useActiveHeading(
  toc: TocEntry[],
  scrollContainer: RefObject<HTMLElement | null>,
): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const allIds = flattenToc(toc).map((e) => e.id);
    if (allIds.length === 0) {
      setActiveId(null);
      return;
    }

    const container = scrollContainer.current;
    if (!container) return;

    const computeActive = () => {
      // The threshold is the top 25% of the scroll container's visible height.
      // Any heading whose top edge is above this line is a candidate; we want
      // the LAST such heading (the one the reader most recently scrolled past).
      const containerRect = container.getBoundingClientRect();
      const threshold = containerRect.top + containerRect.height * 0.25;

      let active: string | null = null;
      for (const id of allIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= threshold) {
          active = id;
        } else {
          // Headings are in document order; once we pass the threshold, stop.
          break;
        }
      }
      // If nothing is above the threshold (user is at the very top),
      // fall back to the first heading.
      setActiveId(active ?? allIds[0]);
    };

    // Set immediately (covers the case where the document is first loaded).
    computeActive();

    container.addEventListener("scroll", computeActive, { passive: true });
    return () => container.removeEventListener("scroll", computeActive);
  // Re-run when a new document is loaded (new toc) or container mounts.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toc, scrollContainer]);

  return activeId;
}

