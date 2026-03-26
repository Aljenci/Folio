# Contributing to Folio

Thank you for your interest in contributing to Folio. This document explains how to report bugs, request features, and submit code changes.

---

## Bug Reports

When opening a bug report, please include:

1. **Folio version** — open the menu (☰) and choose *Help → About Folio…*
2. **Operating system and version** — e.g. macOS 14.4, Windows 11 23H2, Ubuntu 24.04
3. **Steps to reproduce** — numbered, precise, starting from a fresh app launch
4. **Expected behaviour** — what you expected to happen
5. **Actual behaviour** — what actually happened
6. **A minimal reproduction file** — the smallest `.md` file that triggers the issue (if applicable)

> Please search existing issues before opening a new one. Duplicates are closed promptly.

---

## Feature Requests

Before building a feature, **open a Discussion** describing the problem you want solved (not the specific solution). This:
- Prevents effort on features that won't align with Folio's read-only, distraction-free philosophy
- Often leads to better solutions through early discussion
- Avoids duplicate work

Folio's core principle is *"Open a `.md` file. Read it beautifully. Nothing else."* Feature requests that add editing, syncing, note-taking, or vault management are outside scope.

---

## Development Setup

**Prerequisites:**
- [Node.js 20+](https://nodejs.org/) and [pnpm](https://pnpm.io/)
- [Rust (stable)](https://rustup.rs/) — `rustup update stable`
- [Tauri prerequisites](https://tauri.app/start/prerequisites/) for your platform (WebView2 on Windows, Xcode CLI tools on macOS, `libwebkit2gtk` on Linux)

```bash
# Clone and install
git clone https://github.com/yourname/folio.git
cd folio
pnpm install

# Start the development build (hot-reload frontend + Rust backend)
pnpm tauri dev

# Run the unit test suite
pnpm test

# Run tests with coverage report
pnpm test:coverage

# Build a production installer
pnpm tauri build
```

---

## Code Contributions

### Branching

- Fork the repository and create a feature branch from `main`:
  ```bash
  git checkout -b feat/your-feature-name
  ```
- Keep branches focused — one feature or fix per pull request.

### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <short description>

[optional body]
[optional footer]
```

| Type | When to use |
|------|-------------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation changes only |
| `style` | Formatting, whitespace (no logic change) |
| `refactor` | Code restructuring (no feature/fix) |
| `test` | Adding or updating tests |
| `chore` | Build scripts, dependency updates, tooling |
| `perf` | Performance improvements |

Examples:
```
feat: add keyboard shortcut for focus mode toggle
fix: prevent scroll position from resetting on file watch update
docs: update build instructions for Linux prerequisites
```

### Tests

- New features must include unit tests.
- Bug fixes should include a regression test.
- Run `pnpm test` and confirm all tests pass before submitting.
- Coverage targets: ≥ 80% for `src/lib/parser/`, ≥ 70% for `src/stores/`.

### Code Style

- TypeScript strict mode is enabled — no `any` without a comment.
- CSS custom properties must be defined in `src/styles/global.css`, not in component files.
- Components are functional React with hooks — no class components.
- State lives in Zustand stores — no prop drilling beyond one level.
- The ESLint config (`eslint.config.js` or `.eslintrc`) is the authoritative style guide. Run the linter before submitting.

### Pull Requests

1. Ensure `pnpm test` passes.
2. Write a clear PR description explaining *what* changed and *why*.
3. Link to the issue your PR addresses (if applicable): `Closes #123`.
4. Keep PRs small and focused — large PRs are harder to review and slower to merge.
5. Be responsive to review feedback. Stale PRs (no activity for 30 days) are closed.

---

## Project Structure

```
folio/
├── src/                  # React + TypeScript frontend
│   ├── components/       # UI components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Core logic (parser, fonts, navigation)
│   │   └── parser/       # Markdown → HTML pipeline
│   ├── stores/           # Zustand state stores
│   └── styles/           # Global CSS custom properties and base styles
├── src-tauri/            # Rust / Tauri backend
│   ├── src/              # Rust source (commands, main entry)
│   └── tauri.conf.json   # App configuration, bundle settings
├── docs/                 # Development plan and milestone guides
└── test-docs/            # Sample Markdown files for manual testing
```

---

## License

By contributing, you agree that your contributions will be licensed under the [GNU General Public License v3.0](LICENSE).
