import { useLayoutEffect, useEffect, useCallback, RefObject } from "react";
import { useSearchStore } from "../stores/searchStore";

interface UseSearchOptions {
  /** The div containing the rendered document HTML. */
  containerRef: RefObject<HTMLDivElement | null>;
}

/**
 * Manages in-document search highlighting.
 *
 * Reacts to `query` in searchStore: clears old <mark> elements and wraps
 * new matches using DOM mutation (TreeWalker + DocumentFragment).
 * Also reacts to `currentMatch` changes to scroll to the focused match.
 *
 * Uses selective Zustand subscriptions so this hook only causes a
 * re-render when `query` or `currentMatch` change — not on every store
 * update (e.g. matchCount). This is essential because the DOM mutations
 * that insert <mark> elements must survive between renders.
 */
export function useSearch({ containerRef }: UseSearchOptions) {
  // Selective subscriptions: only subscribe to what effects depend on.
  const query        = useSearchStore((s) => s.query);
  const currentMatch = useSearchStore((s) => s.currentMatch);
  const setMatchCount   = useSearchStore((s) => s.setMatchCount);
  const setCurrentMatch = useSearchStore((s) => s.setCurrentMatch);

  /** Remove all <mark class="search-highlight"> elements, merging text nodes back. */
  const clearHighlights = useCallback(() => {
    if (!containerRef.current) return;

    containerRef.current
      .querySelectorAll("mark.search-highlight")
      .forEach((mark) => {
        const parent = mark.parentNode;
        if (parent) {
          parent.replaceChild(
            document.createTextNode(mark.textContent ?? ""),
            mark,
          );
          // normalize() merges adjacent text nodes created by replaceChild.
          // Without this, repeated searches accumulate fragmented text nodes.
          parent.normalize();
        }
      });
  }, [containerRef]);

  /**
   * Walk all text nodes in the container and wrap matches in <mark> elements.
   * Returns the total match count.
   */
  const applyHighlights = useCallback(
    (searchQuery: string): number => {
      if (!containerRef.current || !searchQuery.trim()) return 0;

      const textNodes = getTextNodes(containerRef.current);
      let totalMatches = 0;

      for (const textNode of textNodes) {
        const text = textNode.nodeValue ?? "";

        // Escape regex-special characters so the query is treated as literal text.
        // Without this, searching "a+b" would interpret + as a regex quantifier.
        const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(escaped, "gi");

        const matches: Array<{ start: number; end: number }> = [];
        let m: RegExpExecArray | null;
        while ((m = regex.exec(text)) !== null) {
          matches.push({ start: m.index, end: m.index + m[0].length });
        }

        if (matches.length === 0) continue;

        const parent = textNode.parentNode;
        if (!parent) continue;

        const fragment = document.createDocumentFragment();
        let lastEnd = 0;

        for (const { start, end } of matches) {
          if (start > lastEnd) {
            fragment.appendChild(document.createTextNode(text.slice(lastEnd, start)));
          }

          const mark = document.createElement("mark");
          mark.className = "search-highlight";
          mark.dataset.matchIndex = String(totalMatches);
          mark.textContent = text.slice(start, end);
          fragment.appendChild(mark);
          totalMatches++;

          lastEnd = end;
        }

        if (lastEnd < text.length) {
          fragment.appendChild(document.createTextNode(text.slice(lastEnd)));
        }

        parent.replaceChild(fragment, textNode);
      }

      return totalMatches;
    },
    [containerRef],
  );

  // React to query changes: clear old highlights, apply new ones.
  // useLayoutEffect runs synchronously after DOM commit, before paint,
  // which ensures marks are visible on the very first frame.
  useLayoutEffect(() => {
    clearHighlights();

    if (!query.trim()) {
      setMatchCount(0);
      setCurrentMatch(-1);
      return;
    }

    const count = applyHighlights(query);
    setMatchCount(count);
    setCurrentMatch(count > 0 ? 0 : -1);

    if (count > 0) scrollToMatch(containerRef, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // React to currentMatch changes when the user navigates next/prev.
  useEffect(() => {
    if (currentMatch >= 0) scrollToMatch(containerRef, currentMatch);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMatch]);

  // Expose clearHighlights so App can call it on document change.
  return { clearHighlights };
}

/** Collect all non-empty, searchable text nodes within a container.
 *
 * Text nodes are excluded when they live inside:
 * - `<svg>` — Mermaid diagram text (not prose; scrollIntoView unreliable in SVG)
 * - `<math>` — MathML / KaTeX annotation elements (hidden, contain raw LaTeX)
 * - `[aria-hidden]` — KaTeX visual rendering spans marked as aria-hidden
 * - `<script>` / `<style>` — should not appear after sanitisation but guard anyway
 */
function getTextNodes(container: Element): Text[] {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(node: Text) {
      // Skip empty/whitespace-only text nodes.
      if (!node.nodeValue?.trim()) return NodeFilter.FILTER_REJECT;

      // Walk up the ancestor chain looking for excluded container elements.
      let el: Node | null = node.parentNode;
      while (el && el !== container) {
        if (el.nodeType === Node.ELEMENT_NODE) {
          const tag = (el as Element).tagName.toUpperCase();
          if (
            tag === "SVG" ||
            tag === "MATH" ||
            tag === "SCRIPT" ||
            tag === "STYLE" ||
            (el as Element).hasAttribute("aria-hidden")
          ) {
            return NodeFilter.FILTER_REJECT;
          }
        }
        el = el.parentNode;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    nodes.push(node as Text);
  }
  return nodes;
}

/** Scroll to a specific match index and set its active CSS class. */
function scrollToMatch(
  containerRef: RefObject<HTMLDivElement | null>,
  index: number,
): void {
  if (!containerRef.current) return;

  const marks = containerRef.current.querySelectorAll<HTMLElement>(
    "mark.search-highlight",
  );
  marks.forEach((m) => m.classList.remove("search-match--active"));

  const target = marks[index];
  if (target) {
    target.classList.add("search-match--active");
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}
