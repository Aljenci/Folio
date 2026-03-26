// src/hooks/useZoom.ts
import { useLayoutEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';

/**
 * Discrete zoom levels as percentages of the 18px base size.
 * Discrete steps are more predictable and avoid half-pixel rendering issues.
 */
export const ZOOM_LEVELS = [70, 80, 90, 100, 110, 120, 140, 160] as const;
export type ZoomLevel = (typeof ZOOM_LEVELS)[number];

const DEFAULT_INDEX = 3; // 100%

/**
 * Manages reading zoom by adjusting --font-size-base on the root element.
 * All typography (rem, em, ch units) scales proportionally.
 * Zoom level persists globally in settingsStore — not per document.
 *
 * useLayoutEffect is used (not useEffect) so that the font-size change and
 * scroll restoration happen synchronously before the browser paints — this
 * prevents the visible scroll-position jump that occurs when the document
 * reflows after a font-size change.
 */
export function useZoom() {
  const { zoomIndex, setZoomIndex } = useSettingsStore();

  useLayoutEffect(() => {
    // The scroll container that actually scrolls (not the window).
    const scrollEl = document.querySelector<HTMLElement>('.document-area');

    // Capture fractional scroll position BEFORE the font change causes reflow.
    let ratio = 0;
    if (scrollEl && scrollEl.scrollHeight > scrollEl.clientHeight) {
      ratio = scrollEl.scrollTop / scrollEl.scrollHeight;
    }

    // Apply the new font size (triggers a pending style recalculation).
    const level = ZOOM_LEVELS[zoomIndex] ?? 100;
    const px = (18 * level) / 100;
    document.documentElement.style.setProperty('--font-size-base', `${px}px`);

    // Reading scrollHeight forces a synchronous reflow so the layout
    // reflects the new font size. Then restore the same fractional position.
    if (scrollEl) {
      scrollEl.scrollTop = ratio * scrollEl.scrollHeight;
    }
  }, [zoomIndex]);

  return {
    zoomLevel: ZOOM_LEVELS[zoomIndex] ?? 100,
    zoomIn:    () => setZoomIndex(Math.min(zoomIndex + 1, ZOOM_LEVELS.length - 1)),
    zoomOut:   () => setZoomIndex(Math.max(zoomIndex - 1, 0)),
    resetZoom: () => setZoomIndex(DEFAULT_INDEX),
  };
}
