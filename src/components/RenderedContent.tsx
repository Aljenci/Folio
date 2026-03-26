import { memo, forwardRef, useRef, useEffect } from "react";
import mermaid from "mermaid";
import { useSearchStore } from "../stores/searchStore";

type ResolvedTheme = "light" | "dark" | "sepia";

interface RenderedContentProps {
  html: string;
  theme: ResolvedTheme;
}

/**
 * Renders sanitized Markdown HTML and handles post-render tasks:
 * - Mermaid diagram rendering (requires real DOM)
 * - External link interception
 * - Heading anchor smooth-scroll + URL hash update
 *
 * `dangerouslySetInnerHTML` is safe here because the HTML has been
 * processed by rehype-sanitize, which strips all XSS vectors.
 *
 * Wrapped with React.memo + forwardRef:
 * - memo  → only re-renders when `html` or `theme` props change.
 *           This is critical: search highlights are DOM mutations that must
 *           NOT be wiped by store-driven re-renders.
 * - forwardRef → lets App hold the ref to the `.document-content` div so
 *           the search hook (in App) can query it without causing re-renders
 *           inside this component.
 */
export const RenderedContent = memo(
  forwardRef<HTMLDivElement, RenderedContentProps>(function RenderedContent(
    { html, theme },
    forwardedRef,
  ) {
    // Internal ref for our own DOM effects (Mermaid, link handlers).
    // The forwarded ref gives App access to the same element.
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync internal ref and forwarded ref to the same element.
    function setRef(el: HTMLDivElement | null) {
      (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      if (typeof forwardedRef === "function") {
        forwardedRef(el);
      } else if (forwardedRef) {
        (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      }
    }

    // When the document changes, close search and clear any leftover marks.
    useEffect(() => {
      useSearchStore.getState().closeSearch();
    }, [html]);

    // Intercept external link clicks — prevent webview navigation
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const onClick = (e: MouseEvent) => {
        const target = (e.target as HTMLElement).closest("a");
        if (!target) return;
        const href = target.getAttribute("href");
        if (!href || href.startsWith("#")) return;
        e.preventDefault();
      };

      container.addEventListener("click", onClick);
      return () => container.removeEventListener("click", onClick);
    }, [html]);

    // Intercept heading anchor clicks (href="#section-id") for smooth scroll.
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const handleAnchorClick = (e: MouseEvent) => {
        const anchor = (e.target as Element).closest('a[href^="#"]');
        if (!anchor) return;
        const href = anchor.getAttribute("href");
        if (!href) return;
        const id = href.slice(1);
        const targetEl = document.getElementById(id);
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
          history.pushState(null, "", href);
        }
      };

      container.addEventListener("click", handleAnchorClick);
      return () => container.removeEventListener("click", handleAnchorClick);
    }, [html]);

    // Render Mermaid diagrams after HTML is injected into the DOM.
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "loose",
        theme: theme === "dark" ? "dark" : theme === "sepia" ? "forest" : "default",
      });

      const blocks = container.querySelectorAll<HTMLElement>(
        "pre code.language-mermaid",
      );

      blocks.forEach(async (block) => {
        const pre = block.parentElement;
        if (!pre) return;
        const source = (block.textContent ?? "").trim();
        if (!source) return;

        try {
          const { svg } = await mermaid.render(
            `mermaid-${Math.random().toString(36).slice(2, 9)}`,
            source,
          );
          const wrapper = document.createElement("div");
          wrapper.className = "mermaid-diagram";
          wrapper.innerHTML = svg;
          pre.replaceWith(wrapper);
        } catch (error) {
          const errEl = document.createElement("p");
          errEl.className = "mermaid-error";
          errEl.textContent = `Mermaid error: ${String(error).split("\n")[0]}`;
          pre.replaceWith(errEl);
        }
      });
    }, [html, theme]);

    // Show a helpful empty state instead of a blank page.
    if (!html || html.trim() === "" || html === "<p></p>") {
      return (
        <div
          className="empty-state"
          role="status"
          aria-label="Document is empty"
        >
          <span className="empty-state__icon" aria-hidden="true">
            📄
          </span>
          <p className="empty-state__message">This document is empty.</p>
        </div>
      );
    }

    return (
      <div
        ref={setRef}
        className="document-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }),
);


