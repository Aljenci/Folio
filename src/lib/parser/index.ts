import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { createHighlighter, createJavaScriptRegexEngine, bundledLanguages } from "shiki";
import matter from "gray-matter";
import { rehypeLocalImages } from "./rehype-local-images";
import { buildTocTree } from "./rehype-extract-toc";
import type { TocEntry } from "./rehype-extract-toc";
import type { Schema } from "hast-util-sanitize";

/**
 * Sanitize schema extended to:
 * 1. Preserve id and className on all elements (rehype-slug + Shiki)
 * 2. Allow style and tabindex on code/pre/span (Shiki inline colour tokens)
 * 3. Remove the user-content- prefix so #anchor links resolve correctly
 */
const baseSanitizeSchema: Schema = {
  ...defaultSchema,
  clobberPrefix: "",
  attributes: {
    ...defaultSchema.attributes,
    "*":    [...(defaultSchema.attributes?.["*"] ?? []), "id", "className"],
    "span": ["style", "className"],
    "code": ["style", "className"],
    "pre":  ["style", "className", "tabindex"],
    // KaTeX needs these on math elements
    "math":           ["xmlns", "display"],
    "annotation":     ["encoding"],
  },
};

/**
 * Pre-initialise the Shiki highlighter once.
 * Uses every language bundled with Shiki (330+) so any language fence in a
 * Markdown document is highlighted — including C#, XAML/XML, Razor, Swift,
 * Kotlin, PowerShell, and all others.
 *
 * Uses the JavaScript regex engine (not the Oniguruma WASM engine) so no
 * .wasm file needs to be bundled — this avoids the Vite production build
 * issue where dynamic WASM imports from node_modules are silently dropped.
 *
 * Wrapped in a function that returns null on failure so that a broken
 * production bundle never prevents files from opening — syntax highlighting
 * degrades gracefully to plain text.
 */
function initHighlighter() {
  try {
    return createHighlighter({
      themes: ["github-light", "github-dark"],
      langs: Object.keys(bundledLanguages),
      engine: createJavaScriptRegexEngine(),
    });
  } catch (e) {
    console.error("[Folio] Shiki highlighter failed to initialise:", e);
    return null;
  }
}

const highlighterPromise = initHighlighter();

/**
 * Build a unified processor for a specific document path.
 * The document path is required so the local-image plugin can resolve
 * relative image paths to Tauri asset URLs.
 *
 * If the Shiki highlighter failed to initialise, syntax highlighting is
 * skipped and code blocks render as plain text — the document still opens.
 */
async function buildProcessor(documentPath: string) {
  let highlighter: Awaited<ReturnType<typeof createHighlighter>> | null = null;
  if (highlighterPromise) {
    try {
      highlighter = await highlighterPromise;
    } catch (e) {
      console.error("[Folio] Shiki highlighter unavailable, skipping syntax highlighting:", e);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const processor = (unified() as any)
    .use(remarkParse)
    .use(remarkGfm)          // GFM tables, strikethrough, task lists, footnotes, autolinks
    .use(remarkMath)         // $...$  and $$...$$ math nodes
    .use(remarkRehype, { allowDangerousHtml: true });

  if (highlighter) {
    processor.use(() => rehypeShikiFromHighlighter(highlighter!, {
      // Dual-theme: CSS variables switch colour sets when data-theme changes.
      // No re-processing needed on theme switch — the CSS engine handles it.
      themes: {
        light: "github-light",
        dark:  "github-dark",
      },
    }));
  }

  return processor
    .use(rehypeKatex, {
      throwOnError: false,    // Show a red inline error for invalid LaTeX, don't crash
      errorColor:   "#cc0000",
      trust:        false,    // Prevent LaTeX from injecting arbitrary HTML
    })
    .use(rehypeLocalImages, { documentPath })
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, { behavior: "wrap" })
    .use(rehypeSanitize, baseSanitizeSchema)
    .use(rehypeStringify);
}

export interface Heading {
  id: string;
  text: string;
  level: number;
}

export interface ParseResult {
  html: string;
  frontMatter: Record<string, unknown>;
  headings: Heading[];
  /** Nested TOC tree derived from flat headings at parse time. */
  toc: TocEntry[];
}

export type { TocEntry };

/**
 * Parse a raw Markdown string (possibly with YAML front matter) into HTML.
 *
 * @param raw          The raw Markdown content (may include YAML front matter).
 * @param documentPath Absolute path to the source .md file. Used to resolve
 *                     relative image paths to Tauri asset URLs. Pass an empty
 *                     string when the path is not known (e.g., in tests).
 */
export async function parseMarkdown(
  raw: string,
  documentPath: string = "",
): Promise<ParseResult> {
  const { content, data: frontMatter } = matter(raw);

  const processor = await buildProcessor(documentPath);
  const file = await processor.process(content);
  const html = String(file);

  const headings = extractHeadings(html);
  const toc = buildTocTree(headings.map((h) => ({ depth: h.level, text: h.text, id: h.id })));

  return {
    html,
    frontMatter: frontMatter as Record<string, unknown>,
    headings,
    toc,
  };
}

/**
 * Extract headings annotated with id attributes by rehype-slug.
 * Used to build the Table of Contents in M2.
 */
function extractHeadings(html: string): Heading[] {
  const headings: Heading[] = [];
  const regex = /<h([1-6])[^>]*\bid="([^"]*)"[^>]*>([\s\S]*?)<\/h[1-6]>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    headings.push({
      level: parseInt(match[1], 10),
      id:    match[2],
      text:  match[3].replace(/<[^>]+>/g, "").trim(),
    });
  }

  return headings;
}

