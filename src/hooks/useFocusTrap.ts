import { useEffect, RefObject } from "react";

/**
 * Traps keyboard focus within a container element while active.
 *
 * When active, focus is moved to the first focusable element inside the
 * container. Tab and Shift+Tab cycle through focusable elements within
 * the container only, wrapping at the ends.
 *
 * When the trap is released (isActive → false), focus returns to
 * `returnFocusTo` — the element that was focused before the dialog opened.
 *
 * Required for WCAG 2.1 SC 2.1.2 (no keyboard trap) and the modal dialog
 * pattern (ARIA APG).
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  isActive: boolean,
  returnFocusTo?: HTMLElement | null
) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const focusableSelectors = [
      "button:not(:disabled)",
      "input:not(:disabled)",
      "select:not(:disabled)",
      "textarea:not(:disabled)",
      "a[href]",
      "[tabindex]:not([tabindex='-1'])",
    ].join(", ");

    const container = containerRef.current;
    const focusable = Array.from(
      container.querySelectorAll<HTMLElement>(focusableSelectors)
    );

    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    // Move focus into the dialog on mount.
    first.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        // Shift+Tab moving backwards — wrap to last when at first.
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab moving forwards — wrap to first when at last.
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Return focus to the triggering element when the trap is released.
      returnFocusTo?.focus();
    };
  }, [isActive, containerRef, returnFocusTo]);
}
