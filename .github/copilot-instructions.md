# Folio — GitHub Copilot Instructions

## Project Summary
Folio is a free, open-source, read-only Markdown viewer built with Tauri 2 (Rust backend) + React 18 + TypeScript + Vite. Desktop only. No editing — purely rendering.

## Commands
```bash
pnpm dev              # Vite frontend dev server
pnpm tauri dev        # Full Tauri dev (Rust + React, hot-reload)
pnpm build            # tsc + vite build
pnpm tauri build      # Production build + installer
pnpm test             # Vitest run once
pnpm test:watch       # Vitest watch
pnpm test:coverage    # Vitest with V8 coverage
```

## Architecture: Two-World Model
```
Rust backend (src-tauri/)  ←IPC→  React frontend (src/)
```
- Frontend → Rust: `invoke("command_name", { args })` from `@tauri-apps/api/core`
- Rust → Frontend: `listen("tauri://drag-drop", ...)` from `@tauri-apps/api/event`
- Drag-and-drop uses `tauri://drag-drop` event (NOT browser DragEvent) — provides full absolute paths
- Must call `e.preventDefault()` on browser `dragover`/`drop` or webview navigates away

## Hard Limits
| Constraint | Value |
|-----------|-------|
| Max file size | 10 MB (`MAX_FILE_SIZE` in `commands/file.rs`) |
| Encoding | UTF-8 only (descriptive error returned) |
| File extensions | `.md`, `.markdown` — case-insensitive |
| History depth | 50 entries (`MAX_HISTORY` in historyStore) |
| Test coverage | 70% lines/functions/branches (Vitest thresholds) |

## Key Files
| File | Purpose |
|------|---------|
| `src/App.tsx` | Root: drag-drop listener, file dialog, state routing |
| `src/components/RenderedContent.tsx` | Renders sanitized HTML, intercepts link clicks |
| `src/lib/parser/index.ts` | unified → remark → rehype pipeline |
| `src/stores/documentStore.ts` | Current file, parsed content, loading/error |
| `src/stores/uiStore.ts` | Theme, fontSize, lineWidth |
| `src/stores/historyStore.ts` | Navigation back/forward history |
| `src/stores/settingsStore.ts` | Per-file scroll positions |
| `src-tauri/src/commands/file.rs` | `read_file` + `open_file_dialog` Rust commands |
| `src-tauri/src/lib.rs` | Tauri builder, plugin registration, invoke_handler |
| `src-tauri/tauri.conf.json` | Window config, CSP, bundle settings |
| `src-tauri/capabilities/default.json` | `core:default` permission only |

## Markdown Parser Pipeline
```
gray-matter (strip front matter)
  → unified
  → remark-parse
  → remark-gfm         (tables, task lists, strikethrough, autolinks)
  → remark-rehype
  → rehype-slug        (adds id= to headings)
  → rehype-autolink-headings
  → rehype-sanitize    (XSS prevention — clobberPrefix:"" preserves bare #slug IDs)
  → rehype-stringify
```
- `dangerouslySetInnerHTML` is safe: rehype-sanitize strips all XSS before use
- Sanitize schema extends `defaultSchema` with `id` + `className` on all elements
- `clobberPrefix: ""` — do NOT remove; without it heading IDs become `user-content-*` breaking TOC anchors

## Tauri 2 Notes
- Import: `@tauri-apps/api/core` for `invoke`, `@tauri-apps/api/event` for `listen`
- Dialog is `tauri-plugin-dialog` (separate crate) — registered with `.plugin(tauri_plugin_dialog::init())`
- `open_file_dialog` must be `async` in Rust to avoid blocking the main thread

## CSS Theming
- All colours use CSS custom properties on `:root`
- Theme switching: set `data-theme="dark"` or `data-theme="sepia"` on `<html>`
- Font size controlled via `--font-size-base` CSS var (set from `uiStore.fontSize`)
- Line width controlled via `--line-width` CSS var (set from `uiStore.lineWidth`)

## Mermaid Theme Mapping (M1)
```typescript
const mermaidTheme = theme === 'dark' ? 'dark' : theme === 'sepia' ? 'forest' : 'default';
```

## Testing Conventions
- Mock all Tauri IPC in `src/test-setup.ts` — tests never make real IPC calls
- Fixtures in `src/test/fixtures/*.md`
- Test files: `**/__tests__/*.test.ts`
- Run with `pnpm test`

## Conventions
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`)
- **Package manager:** pnpm only — never npm or yarn
- **Rust:** `cargo fmt` + `cargo clippy` before committing
- **No editing features** — Folio is read-only
