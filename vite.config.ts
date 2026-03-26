/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async () => ({
  plugins: [react()],

  // Prevent Vite from obscuring Rust errors, use fixed port for Tauri
  clearScreen: false,

  // Map Node.js globals referenced by dependencies (e.g. gray-matter)
  define: {
    global: "globalThis",
  },

  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? { protocol: "ws", host, port: 1421 }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },

  build: {
    // Warn when any individual chunk exceeds 600 KB (before gzip)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split heavy rendering dependencies into lazy-loadable chunks.
          // Mermaid and Shiki are large; keeping them separate reduces the
          // initial vendor bundle and allows parallel loading.
          if (id.includes("mermaid") || id.includes("cytoscape")) {
            return "vendor-mermaid";
          }
          if (id.includes("shiki") || id.includes("@shikijs")) {
            return "vendor-shiki";
          }
          // All remaining node_modules (including KaTeX) land in a stable
          // vendors chunk. Avoiding a separate katex chunk prevents the
          // circular-dependency warning that arises from shared sub-deps.
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
  },

  // Vitest configuration
  test: {
    globals: true,
    environment: "jsdom",
    testTimeout: 30000,
    setupFiles: ["./src/test-setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      // Restrict coverage measurement to the modules that have tests.
      // M5 targets: ≥ 80% for src/lib/parser/, ≥ 70% for src/stores/.
      include: [
        "src/lib/parser/**/*.{ts,tsx}",
        "src/stores/**/*.{ts,tsx}",
      ],
      exclude: [
        "src/**/__tests__/**",
        "src/**/*.test.{ts,tsx}",
        "src/test-setup.ts",
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },
  },
}));
