# The Complete Guide to Everything

This document tests the **Table of Contents sidebar** with a rich heading hierarchy — multiple levels, many sections, and long heading text that should truncate in the sidebar.

Scroll this document while the TOC sidebar is open to verify active heading tracking.

---

## Chapter 1 — Introduction

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.

### 1.1 Background

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.

### 1.2 Motivation

Sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.

#### 1.2.1 Why Navigation Matters

A beautifully rendered 200-page document is frustrating if you cannot jump to the section you need. Navigation is not optional polish — it is core to what makes a reading tool useful.

#### 1.2.2 Prior Art and Inspiration

Many tools have attempted this. Most fall short on performance or accessibility. This guide documents the approach taken by Folio.

### 1.3 Scope and Limitations

Totam rem aperiam eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

---

## Chapter 2 — Architecture

The system is built on a unified pipeline from Markdown AST to rendered HTML.

### 2.1 The Parser Pipeline

Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.

### 2.2 The Component Tree

Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.

#### 2.2.1 App Shell

The `app-shell` layout uses CSS flexbox. The sidebar is `position: fixed` so it overlays rather than pushes content.

#### 2.2.2 Document Area

The document area has `overflow-y: auto` which creates the scroll container. This is the element the `ProgressBar` and `IntersectionObserver` both reference.

#### 2.2.3 Rendered Content

The `RenderedContent` component receives `ref` from `App` via `forwardRef`, allowing the search hook to access the DOM root for text node mutation.

### 2.3 State Management

Ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam.

---

## Chapter 3 — Table of Contents

### 3.1 Extraction Strategy

The TOC is derived from the flat `headings[]` array already present in `ParseResult`. The `buildTocTree()` function converts it to a nested tree using a stack algorithm.

### 3.2 The Stack Algorithm

The key insight: maintain a stack of `[depth, children-array]` pairs. When you encounter a heading, pop stack entries whose depth is ≥ current heading's depth to find the parent.

### 3.3 The TocTree Component

`TocTree` is a recursive component — it renders a `TocTree` inside itself for child entries. Dynamic `paddingLeft` conveys depth without requiring pre-defined CSS classes for every possible depth.

### 3.4 Active Heading Tracking

#### 3.4.1 Why IntersectionObserver

The `scroll` event fires 60+ times per second. `getBoundingClientRect()` inside a scroll handler forces synchronous layout recalculation. IntersectionObserver fires asynchronously after layout, only when something changes.

#### 3.4.2 The Detection Zone

`rootMargin: '-10% 0px -85% 0px'` creates a detection band in the top 5% of the viewport. A heading entering this band is considered the "current" section.

---

## Chapter 4 — In-Document Search

### 4.1 Architecture Choice

Three approaches were considered: `window.find()` (no control), CSS Highlight API (inconsistent support), DOM mutation (full control — chosen).

### 4.2 The TreeWalker API

`document.querySelectorAll` selects elements, not text nodes. `TreeWalker` with `NodeFilter.SHOW_TEXT` traverses text nodes directly.

### 4.3 Regex Safety

Search queries are escaped with `replace(/[.*+?^${}()|[\]\\]/g, '\\$&')` before creating a `RegExp`. This treats the query as literal text.

### 4.4 Match Navigation

Wrap-around navigation uses modulo arithmetic:
- Next: `(current + 1) % matchCount`
- Prev: `(current - 1 + matchCount) % matchCount`

The `+ matchCount` before `%` ensures we never take modulo of a negative number.

---

## Chapter 5 — Progress Bar

### 5.1 Scroll Geometry

`scrollTop / (scrollHeight - clientHeight)` gives a value from 0 (top) to 1 (bottom). Multiply by 100 for percentage.

### 5.2 Passive Listeners

`{ passive: true }` on the scroll event listener tells the browser we will not call `preventDefault()`, allowing it to scroll without waiting for the handler.

---

## Chapter 6 — Command Palette

### 6.1 Inspiration

The heading palette is modelled on VS Code's `Ctrl+Shift+O` symbol navigator. Type to filter, arrow keys to navigate, Enter to jump.

### 6.2 Keyboard Navigation

Arrow keys update `selectedIndex`. The selected item is scrolled into view with `scrollIntoView({ block: 'nearest' })` — this only scrolls the list if the item is not already visible.

### 6.3 Backdrop Dismiss

A transparent full-screen `div` behind the palette catches outside clicks and calls `onClose`.

---

## Chapter 7 — Keyboard Shortcuts

### 7.1 Centralisation

All shortcuts are registered in `useKeyboard()` and called once at the App root. Scattering `addEventListener` across components causes duplicate registrations and conflict bugs.

### 7.2 Typing Guard

Before acting on a shortcut, the handler checks `(e.target as HTMLElement).tagName`. If the target is `INPUT` or `TEXTAREA`, the shortcut is suppressed so the user can type freely.

---

## Appendix A — This heading has a very long title that should be truncated in the TOC sidebar with an ellipsis

This tests `white-space: nowrap; overflow: hidden; text-overflow: ellipsis` on `.toc-link`.

## Appendix B — Unicode Support: 日本語, Ελληνικά, العربية

Unicode heading text should appear correctly in the TOC.

## Appendix C — Code in Heading: `const x = 1`

The TOC should strip the inline code and show plain text.
