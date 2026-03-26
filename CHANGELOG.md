# Changelog

All notable changes to Folio are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [1.0.0] — 2026-03-24

### Added

#### Core rendering
- Full CommonMark + GitHub Flavored Markdown (GFM) rendering via unified/remark/rehype pipeline
- GFM extensions: tables, task-list checkboxes, strikethrough, footnotes, autolinks
- YAML front matter parsing and extraction via gray-matter
- Syntax highlighting for 20+ languages (JavaScript, TypeScript, Rust, Python, Go, C/C++, HTML, CSS, JSON, YAML, TOML, Bash, SQL, Markdown, diff) via Shiki with dual light/dark theme support
- Math rendering: inline (`$...$`) and block (`$$...$$`) via remark-math + rehype-katex
- Mermaid diagram rendering (flowcharts, sequence diagrams, Gantt, etc.)
- Heading ID slugs for anchor links (rehype-slug)
- XSS sanitization of raw HTML embedded in Markdown (rehype-sanitize)

#### User interface
- Welcome screen shown when no file is open (drag-and-drop prompt, recent files list)
- Three themes: **Light** (warm white), **Dark**, and **Sepia** — with smooth 200ms animated transitions
- Theme auto-detection following the OS preference (`prefers-color-scheme`)
- Custom title bar with filename display
- Reading progress bar (subtle, top of window)
- TOC sidebar with heading tree and active heading tracking via IntersectionObserver
- Focus mode: gradient vignette that narrows visual attention to the current paragraph
- Hover-reveal floating toolbar (theme toggle, TOC toggle, zoom)
- Settings panel: font selection, line spacing, column width

#### Navigation
- In-document search with match count and keyboard navigation (`⌘F` / `Ctrl+F`, `Enter`/`⇧Enter` for next/prev)
- Match highlighting with CSS mark-based rendering
- Jump-to-heading command palette (`⌘G` / `Ctrl+G`) with fuzzy filtering
- Back/forward navigation history within a session

#### Native integration (via Tauri)
- File open via native dialog (`⌘O` / `Ctrl+O`)
- Drag-and-drop file opening
- CLI argument: `folio path/to/file.md` opens the file directly
- File watching: auto-reloads the document when the source file is saved externally
- Recent files list persisted across sessions (up to 20 entries, FIFO eviction)
- Last-opened file restored on app restart
- Per-file scroll position persistence
- Multiple windows support (`⌘N` / `Ctrl+N`)
- Print and export to PDF (`⌘P` / `Ctrl+P`) with a dedicated print stylesheet
- Single-instance enforcement (second launch opens file in the existing window)
- Window state persistence (size, position) across restarts
- `.md` and `.markdown` file associations registered at install time

#### Typography & reading experience
- Five font options: Lora (default), Source Serif 4, Inter, OpenDyslexic, JetBrains Mono
- Variable font support for smooth weight rendering
- Typographic scale based on 18px body, max 68ch line length
- Line spacing presets: compact (1.5), normal (1.75), relaxed (2.1)
- Column width presets: narrow (55ch), medium (68ch), wide (85ch)
- Zoom levels: 70%–160% in 8 discrete steps, persisted globally
- Text selection enabled (copy-paste); cursor is `default` to communicate read-only mode

#### Accessibility
- Full keyboard navigation for all interactive elements
- WCAG 2.1 AA colour contrast in all three themes
- Screen reader support: live regions, `role="alert"` for error banners, ARIA labels throughout
- Reduced motion support (`prefers-reduced-motion`) — disables all CSS transitions
- OpenDyslexic font option for readers with dyslexia
- Focus indicators meet WCAG 2.4.7

#### Error handling
- User-friendly error banners for: file not found, permission denied, non-UTF-8 encoding, oversized files (> 10 MB), parse failures
- No raw error codes or stack traces exposed to the user
- Graceful recovery — error state does not crash the app

#### Testing
- Unit test suite (Vitest) covering the Markdown parsing pipeline (17 tests) and all six Zustand stores (63 tests)
- Parser performance budget tests: < 200ms for 10 KB documents, < 1000ms for 100 KB documents

### Technical

- Built with Tauri 2 (Rust backend) + React 19 + TypeScript
- Frontend bundled with Vite 7
- State management: Zustand 5
- Settings persistence: `@tauri-apps/plugin-store`
- v1.0.0 ships **unsigned** — see README for Gatekeeper (macOS) and SmartScreen (Windows) workarounds
- Code signing planned for v1.1

---

[1.0.0]: https://github.com/yourname/folio/releases/tag/v1.0.0
