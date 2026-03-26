# h3-Only Headings Test

This document has **no h1 or h2 headings** — only h3 and below. This tests that `buildTocTree` handles depth gaps gracefully (no crash, all items render at the top level of the TOC).

---

### Setting Up Your Environment

Before you begin, install the required dependencies using your package manager of choice.

### Installing Node.js

Download the LTS version from the official website. Verify the installation with `node --version`.

### Installing pnpm

Run `npm install -g pnpm` or use the standalone installer from the pnpm documentation site.

#### Configuring pnpm Workspace

Create a `pnpm-workspace.yaml` at the repo root listing your packages.

#### Caching Strategies

pnpm uses a content-addressable store shared across projects. This dramatically reduces disk usage.

### Project Structure

Organise your files into `src/`, `tests/`, and `docs/` directories from the start.

### Running the Dev Server

Run `pnpm dev` — Vite will start on port 5173 by default.

#### Hot Module Replacement

Vite's HMR updates modules in place without a full page reload, preserving component state.

#### Network Access

Pass `--host` to expose the dev server on your local network for testing on mobile devices.

### Building for Production

Run `pnpm build` — outputs to `dist/`. The output is fully static and can be served from any CDN.
