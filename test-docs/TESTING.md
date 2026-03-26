# Folio — Manual Testing Checklist (M0 + M1 + M2)

## How to Launch

**Start the app in development mode:**

```
pnpm tauri dev
```

> First Rust compile takes ~30–60 seconds. Subsequent starts are much faster.
> The app window opens automatically when ready.

**Opening files:**
- Drag & drop a `.md` file onto the window, OR
- Click the **"Open File"** button on the empty screen

**Test files are all in the `test-docs/` folder** (relative to the project root).

---

## Before You Start

- [x] `pnpm tauri dev` starts without errors in the terminal
- [x] `pnpm test` passes — run in a separate terminal: `pnpm test`
- [x] The app window opens and shows the Folio empty/drop screen (not a blank window)
- [x] No errors in the browser DevTools console on startup (F12 or right-click → Inspect)

---

---

# M0 — Foundation

## File Opening

Open each file by dragging it onto the window or using "Open File".

**Open `test-docs/m0-frontmatter.md`**
- [x] File opens and renders as styled HTML (not raw Markdown text)
- [x] The YAML front matter block (`title:`, `author:`, `date:`, `tags:`) is **not** visible in the rendered output
- [x] Only the heading and body content appear

**Open `test-docs/m0-xss.md`**
- [x] File opens without any alert dialogs appearing
- [x] Page renders normally — heading and paragraphs are visible
- [x] Open DevTools → Elements tab: no `<script>` tags, no `onerror` or `onclick` attributes in the DOM

**Try a non-Markdown file** (drag any `.txt`, `.jpg`, `.pdf`, or `.png` file)
- [x] App shows a friendly error message (e.g. "Not a Markdown file: …")
- [x] App does not crash; the error screen has an "Open File" button to recover

**Try dragging a `.MD` file** (uppercase extension, if you can rename one)
- [x] Opens correctly — extension check is case-insensitive

---

## Rust Commands

- [x] `read_file` works — files open without errors on happy path
- [x] Try opening a very large file (> 10 MB) if available — should show a user-friendly error, not hang

---

---

# M1 — The Beautiful Reader

> **Primary test file: `src/test/fixtures/m1-fixture.md`**
> This covers every M1 feature in one document. Open it and work through each section.

## Typography

- [x] Body text uses a serif font (Lora), not the browser default (Times New Roman or system sans-serif)
- [x] `h1` is noticeably larger than `h2`, which is larger than `h3` — clear visual hierarchy
- [x] `h6` is smaller/muted compared to `h5`
- [x] Line length is constrained (text doesn't stretch full width on a wide window)
- [x] Line spacing feels comfortable — not cramped, not double-spaced
- [x] The first element in the document has no extra top margin (content starts near the top)

## Themes

_(Themes are currently applied via `settingsStore`. For now test with OS dark/light mode toggle if a settings UI isn't present yet.)_

- [x] **Light theme:** white/off-white background, dark text, blue accent links
- [x] **Dark theme:** dark background (near-black), light text — activate by switching OS to dark mode
- [x] Theme switch produces a smooth crossfade (200ms), not an instant flash
- [x] Code block colours change when switching between light and dark
  Comment: Codeblock is always in light mode → **FIXED in this build** — changed CSS selector from `.shiki span` to `pre span` so it works even if sanitizer strips the `shiki` class. Please re-test.
  Comment: Yes is working now in dark mode

## Code Blocks (Section 7 of fixture)

- [x] JavaScript code block has syntax highlighting (coloured tokens, not all black)
- [x] TypeScript code block has syntax highlighting
- [x] Python code block has syntax highlighting
- [x] Bash code block has syntax highlighting
- [x] Rust code block has syntax highlighting
- [x] `foobarbaz` unknown language block renders as plain monospace text — **no error, no crash**
- [x] All code blocks use a monospace font (JetBrains Mono), distinct from body text

## Math — KaTeX (Section 8 of fixture)

- [x] Inline math `$E = mc^2$` renders as a proper mathematical expression (not as raw LaTeX)
- [x] Block math (Gaussian integral) renders centred and larger than inline math
- [x] Invalid KaTeX `$\invalidcommand{broken}$` shows a **red inline error**, not a crash or blank space

## Mermaid Diagrams (Section 9 of fixture)

- [x] The flowchart (`graph TD`) renders as an SVG diagram (not as a code block)
- [x] The sequence diagram renders as an SVG diagram
- [x] The malformed Mermaid block shows an **error message** where the diagram would be (not blank, not crash)
  Comment: **FIXED in this build** — switched to `securityLevel: "loose"`, added `.trim()` on source, shortened error messages. Please re-test flowchart and sequence diagram.
  Comment: Mermaid now seems all correct

## GFM Extensions

- [x] Tables (Section 5) render with borders, a distinct header row, and alternating row colours
- [x] Strikethrough `~~text~~` (Section 6) has a line through it
- [x] Task list checkboxes (Section 4) render as styled checkboxes — checked items look different from unchecked
- [x] Checkboxes are **not interactive** (clicking them does nothing)
  Comment: But the checkbox are ugly

## Footnotes (Section 10 of fixture)

- [x] Footnote references appear as superscript numbers in the text
- [x] Footnote definitions appear at the bottom of the document
- [x] Clicking a footnote reference jumps to the definition

## Images (Section 11 of fixture)

- [x] Remote image (picsum.photos URL) loads and displays
- [x] Broken image reference does **not crash** the renderer (a broken image icon is acceptable)

## Zoom

- [x] `Ctrl+` / `Cmd++` zooms in — all text (headings, body, code) gets larger proportionally
- [x] `Ctrl-` / `Cmd+-` zooms out
- [x] `Ctrl+0` / `Cmd+0` resets to 100%
- [x] Zoom affects line length (the `ch` measure scales with font size)
  Comment: Zoom caused scroll position to jump → **FIXED in this build** — useLayoutEffect + forced reflow preserves fractional scroll position on zoom
  Comment: Is better but not perfect, it continues to moving but a lot less.
  Comment: Now much better, is not perfect but is good enough

---

---

# M2 — Navigation & Search

## TOC Sidebar

**Open `test-docs/toc-test.md`**

- [x] **Open sidebar:** Press `Ctrl+Shift+T` (Win/Linux) or `Cmd+Shift+T` (Mac) → sidebar slides in from the left with a smooth animation
- [x] **Close sidebar:** Press `Ctrl+Shift+T` again → sidebar slides out smoothly (not a snap)
- [x] **Close button:** Open sidebar → click the `✕` in the sidebar header → closes
- [x] **Heading nesting:** h2 items are indented under h1; h3 items are indented under h2; h4 under h3
- [x] **All headings present:** Every heading in the document appears in the sidebar
- [x] **Layout shift:** Document content shifts right when sidebar opens (no overlap); shifts back when closed
- [x] **Click to navigate:** Click any TOC entry → document scrolls smoothly to that heading
- [x] **Active heading highlight:** Scroll through the document → the TOC entry for the visible heading gets accent-coloured highlight
  Comment: **FIXED in this build** — replaced IntersectionObserver with scroll listener; please re-test
- [x] **TOC auto-scroll:** As you scroll through the document, the active TOC entry stays visible in the sidebar
  Comment: **FIXED in this build** — please re-test
- [x] **Long heading truncation:** Appendix A has a very long heading — it should be truncated with `…` in the TOC
- [x] **Anchor links:** Click the `¶` icon next to any heading → page scrolls smoothly; check the URL updates (e.g. `#chapter-1`)
  Comment: I cannot see the anchor icon, but clicking the title it auto scroll correctly. → **FIXED in this build** — ¶ icon now added via CSS ::after on hover; please re-test
  Comment: The autoscroll needs to have a margin → **FIXED** — scroll-margin-top: 1.5rem added to headings

**Open `test-docs/h3-only.md`**
- [x] TOC renders without error — h3 items appear at the top level (no h1/h2 parent)

## In-Document Search

**Open `test-docs/search-test.md`**

- [x] **Open search:** Press `Ctrl+F` / `Cmd+F` → floating search bar appears top-right with cursor focused
- [x] **Highlights:** Type `javascript` → all occurrences highlighted yellow throughout the document
  Comment: **FIXED in this build** — `React.memo` prevents store re-renders from wiping marks; `useLayoutEffect` ensures marks apply before paint; selective Zustand subscriptions reduce unnecessary re-renders. Please re-test.
  Comment: Now is working.
- [x] **Match count:** Display shows `1 of N` (verify N matches what you count in the doc)
- [x] **Next match:** Press `Enter` or click `↓` → moves to next match (highlighted orange/distinct)
- [x] **Previous match:** Press `Shift+Enter` or click `↑` → moves to previous match
- [x] **Wrap forward:** Advance past last match → wraps to match 1
- [x] **Wrap backward:** Go back from match 1 → wraps to last match
- [x] **Case insensitive:** Search `JAVASCRIPT` → same matches as `javascript`
- [x] **Close Escape:** Press `Escape` → bar closes, all yellow highlights disappear from document
- [x] **Close ✕:** Re-open search → click `✕` button → same as Escape
- [x] **Regex chars `a+b`:** Type `a+b` → no crash, shows "No matches"
- [x] **Regex chars `file.md`:** Type `file.md` → no crash
- [x] **Regex chars `[test]`:** Type `[test]` → no crash
- [x] **Empty query:** Clear the input completely → no highlights, no error, count disappears
- [x] **No matches:** Type `xyzzy123notaword` → shows "No matches", no crash
- [x] **Typing guard:** With search open, press `Ctrl+G` → command palette does **not** open
  Comment: i dont know if this is working or not I see a new field but is different of the command palette. It seems the search browser default, so not the command palette. → **FIXED in this build** — Ctrl+F/G/T now always preventDefault so browser's native find bar is suppressed; please re-test
  Comment: Now seems to work, but when jumping to next or prev occurrence all the highlights disappear and the scroll to focus in the selected text is not working → **FIXED in this build** — moved useSearch to App level; RenderedContent (memoized) no longer re-renders on store changes, so marks survive navigation. Please re-test.
  Comment: Now is working correctly. But I see and issue, for example in the m1-fixture.md if I search Head it says 7 entries but I cannot see 4, the last 3 are not showing. maybe is detecting some metadata or not renderer content?

**Open a new file while search bar is open**

- [x] Search bar closes automatically when a new document is loaded
- [x] Highlights from the previous document do not appear in the new document
  Comment: Test after highlights are confirmed working in this build

## Reading Progress Bar

**Open `test-docs/long-document.md`**

- [x] A thin accent-coloured line is visible at the very top of the window
- [x] At the top of the document the bar is empty (or nearly so)
- [x] Scrolling down fills the bar proportionally left-to-right
- [x] Reaching the very bottom shows the bar fully filled
- [x] Bar movement is smooth (no large jumps)

## Heading Command Palette

**Open `test-docs/toc-test.md`**

- [x] **Open:** Press `Ctrl+G` / `Cmd+G` → modal palette appears centred with a semi-transparent backdrop
  Comment: is not semitransparent but it seems good
- [x] **Backdrop dismiss:** Click outside the palette → closes without navigating
- [x] **Escape closes:** Press `Escape` → closes without navigating
- [x] **All headings listed:** Unfiltered list shows all headings with H1/H2/H3 depth labels
- [x] **Filter:** Type `chapter` → list narrows to matching headings only (case-insensitive)
- [x] **No results:** Type `xyzzy` → shows "No matching headings", no crash
- [x] **Arrow down:** Press `↓` → selection moves down (highlighted row)
- [x] **Arrow up:** Press `↑` → selection moves up
- [x] **Enter to jump:** Arrow to a heading, press `Enter` → palette closes, document scrolls to it
- [x] **Click to jump:** Click any palette item → same result as Enter
- [x] **Typing guard:** With palette open, press `Ctrl+F` → search bar does **not** open
  Comment: It shows a search field but it seems to be the browser default → **FIXED in this build** — always preventDefault for these keys; please re-test

## Keyboard Shortcut Summary

- [x] `Ctrl/Cmd+Shift+T` — Toggle TOC sidebar ✓
- [x] `Ctrl/Cmd+F` — Open search ✓
- [x] `Ctrl/Cmd+G` — Open heading palette ✓
- [x] `Ctrl/Cmd++` or `=` — Zoom in ✓
- [x] `Ctrl/Cmd+-` — Zoom out ✓
- [x] `Ctrl/Cmd+0` — Reset zoom ✓

---

---

# M1 Regression After M2

Open `src/test/fixtures/m1-fixture.md` again after testing M2 features.

- [x] Typography unchanged — same fonts, same spacing as before
- [x] Syntax highlighting still works
  Comment: Works but only light mode even in dark mode → **FIXED in this build** — dark mode Shiki CSS corrected
- [x] KaTeX math still renders
- [x] Mermaid diagrams still render
- [x] Zoom still works
- [x] Drag & drop still works

---

## Reporting Issues

When you find a failure, note:
1. **Which file** was open
2.  **Which step** failed (e.g. "M2 › Search › Regex chars `a+b`")
3. **What happened** vs **what was expected**
4. Any **console errors** (F12 → Console tab)



   Comment: I see a second scroll bar when opening m1-fixture.md → **FIXED** — overflow:hidden on html/body. Mermaid error → **FIXED in this build** — securityLevel "loose" + trim. Please re-test.
