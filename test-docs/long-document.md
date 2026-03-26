# The Long Document

> **Purpose:** Test the reading progress bar. This document is intentionally long.
> Scroll from top to bottom and verify the progress bar fills smoothly from 0% to 100%.

---

## Part I — The Nature of Long Documents

Long documents present unique challenges for reading applications. Unlike short articles that fit within a single viewport, long documents require users to maintain spatial orientation as they scroll. Without orientation cues, readers feel lost.

The reading progress bar solves this with a single thin line at the top of the window. It fills from left to right as you scroll, giving you a constant peripheral sense of how far through the document you are — without requiring any conscious attention.

### Why a Bar at the Top?

The top of the window is prime real estate. It is always visible regardless of scroll position. A bar at the bottom would scroll out of view on many setups. A sidebar percentage would compete for attention with content. The thin top bar is maximally unobtrusive.

### The Mathematics

The progress percentage is calculated as:

```
progress = scrollTop / (scrollHeight - clientHeight) × 100
```

- `scrollTop`: how many pixels the container has scrolled from the top
- `scrollHeight`: total pixel height of all content
- `clientHeight`: pixel height of the visible viewport

When `scrollTop` equals `scrollHeight - clientHeight`, the user is at the very bottom.

---

## Part II — A Survey of History

### Chapter 1 — Ancient Libraries

The Library of Alexandria is estimated to have contained 400,000 to 700,000 scrolls at its height. Papyrus scrolls were the primary medium for storing long-form text. Reading a scroll required physical progression — you could not jump to a page number, because page numbers did not exist.

The physical format of a scroll enforced linear reading. The reader would unroll from one end and reroll the other, always maintaining their physical position in the text. This physical constraint was both limitation and feature: it prevented random access but made position tangible and visceral.

### Chapter 2 — The Codex

The codex — the ancestor of the modern book — replaced the scroll around the 4th century CE. Pages could now be numbered. Random access became possible. The reader could flip to any page, use a finger as a bookmark, and compare passages from different sections.

The codex created the need for navigational apparatus: tables of contents, indexes, page numbers. These are all solutions to the same underlying problem: how do you orient a reader within a large body of text?

### Chapter 3 — Print Indexes

The printed index, pioneered in the 15th century, was a revolution in navigation. A reader could now look up a concept and jump directly to every page where it appeared. This is, in essence, exactly what in-document search does — find all occurrences and let you jump between them.

### Chapter 4 — Digital Hypertext

Ted Nelson coined the term "hypertext" in 1963 to describe text that links to other text. The World Wide Web, invented by Tim Berners-Lee in 1989, made hypertext universally accessible. Links enabled non-linear navigation at global scale.

Within a single document, the anchor link (`<a href="#section">`) is the digital successor to the index entry. Click a link in a table of contents and jump directly to the section. The mechanism is different; the purpose is identical.

---

## Part III — Technical Implementation Notes

### Passive Event Listeners

The `{ passive: true }` option on event listeners tells the browser that the handler will not call `preventDefault()`. For scroll events, this means the browser can initiate scrolling immediately without waiting for the JavaScript handler to complete. This can eliminate hundreds of milliseconds of scroll jank on mobile devices.

Always use `{ passive: true }` for scroll, touchstart, and touchmove event listeners unless you genuinely need to prevent the default action.

### React and Scroll Events

React's synthetic event system does not support passive listeners. If you use React's `onScroll` prop, you get a non-passive listener by default. For performance-critical scroll handling, use `addEventListener` directly with `{ passive: true }` in a `useEffect`.

```typescript
useEffect(() => {
  const el = scrollContainerRef.current;
  if (!el) return;

  const update = () => { /* ... */ };
  el.addEventListener('scroll', update, { passive: true });
  return () => el.removeEventListener('scroll', update);
}, [scrollContainerRef]);
```

### The ResizeObserver Consideration

If the user resizes the window, `clientHeight` and `scrollHeight` change. The progress percentage should update accordingly. One approach: add a `ResizeObserver` to re-trigger the calculation when the scroll container's size changes. This is not yet implemented (a potential M3/M4 enhancement).

---

## Part IV — Accessibility Notes

### The ARIA progressbar Role

The `role="progressbar"` attribute communicates to assistive technologies that this element represents a progress indicator. The required ARIA attributes are:

- `aria-valuenow`: the current value (0–100)
- `aria-valuemin`: the minimum value (0)
- `aria-valuemax`: the maximum value (100)
- `aria-label`: a human-readable description ("Reading progress")

Screen readers may announce "Reading progress: 45%" when a user navigates to this element. Keeping the label concise and the value rounded to an integer improves the experience.

### Reduced Motion

Users who prefer reduced motion (via the `prefers-reduced-motion` media query) may find smooth progress bar transitions distracting. A future enhancement would disable the 40ms transition when reduced motion is preferred:

```css
@media (prefers-reduced-motion: reduce) {
  .progress-bar__fill {
    transition: none;
  }
}
```

---

## Part V — Design Decisions Log

### Decision 1: Fixed Position vs. Sticky

The progress bar uses `position: fixed; top: 0` rather than `position: sticky`. Fixed positioning ensures the bar is always at the top of the viewport regardless of what scroll container is active. Sticky positioning is relative to the nearest scrolling ancestor, which can behave unexpectedly in nested scroll containers.

### Decision 2: Height of 3px

3 pixels is thin enough to be unobtrusive (the eye barely registers it in peripheral vision) but thick enough to be clearly visible when looked at directly. 2px would be too thin on low-DPI displays; 4px starts to feel like a UI element competing for attention with content.

### Decision 3: Accent Colour

Using `var(--accent)` means the progress bar automatically adapts to the current theme and respects the user's potential future customisation of the accent colour. Hardcoding a blue would break in sepia and dark themes.

### Decision 4: No Label or Percentage Text

Many reading apps show "42% read" or similar text. This was consciously omitted. The bar communicates position spatially, the way a physical bookmark does. Adding text would make it a UI element that demands reading, defeating the purpose of a peripheral orientation cue.

---

## Part VI — Testing Long Document Scenarios

You have now scrolled through a significant portion of this document. If you are reading this section, verify:

1. The progress bar shows approximately 75–85% (depending on your viewport height)
2. The TOC sidebar (if open) has been tracking your position through the headings
3. The document typography has remained consistent throughout

### The Final Sections

Only a few more sections remain. The progress bar should be almost full by the time you reach the very end.

---

## Part VII — Conclusion

### Summary

This document served three purposes:
1. Providing enough content for the progress bar to show meaningful progress
2. Documenting the design and implementation of the progress bar itself
3. Testing that long documents render without performance issues

### The End

You have reached the end of the document. The reading progress bar should now show 100% (fully filled). The TOC sidebar's last entry should be active.

Congratulations on completing the progress bar test. ✓
