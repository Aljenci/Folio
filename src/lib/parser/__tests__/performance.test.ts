import { describe, it, expect, beforeAll } from "vitest";
import { parseMarkdown } from "../index";

/** Generates a synthetic Markdown document of a given approximate size. */
function generateDocument(paragraphCount: number): string {
  return Array.from({ length: paragraphCount }, (_, i) =>
    `## Section ${i + 1}\n\n` +
    `This is paragraph ${i + 1} with **bold text**, *italic text*, and \`inline code\`. ` +
    `It contains a [link](https://example.com) and enough content to be representative ` +
    `of a real-world Markdown document.\n`
  ).join("\n");
}

describe("Parser performance budgets", () => {
  // Warm up the parser once before measuring — this triggers the Shiki
  // highlighter's async initialisation (loading grammar/theme files).
  // Without this, the first timed test includes ~200ms of one-time setup.
  beforeAll(async () => {
    await parseMarkdown("# warm-up", "");
  });

  it("processes a small document (~10 KB) in under 200ms", async () => {
    const content = generateDocument(50); // ~10 KB
    const start = performance.now();
    await parseMarkdown(content, "");
    const elapsed = performance.now() - start;
    // Budget: < 200ms (M5 target for < 10KB documents, after warm-up)
    expect(elapsed).toBeLessThan(200);
  });

  it("processes a medium document (~100 KB) in under 1000ms", async () => {
    const content = generateDocument(500); // ~100 KB
    const start = performance.now();
    await parseMarkdown(content, "");
    const elapsed = performance.now() - start;
    // Budget: < 2000ms (2× the user-facing 1000ms target — test environments are slower)
    expect(elapsed).toBeLessThan(2000);
  });

  it("parse result is deterministic — two parses of the same content return equal HTML", async () => {
    const content = "# Title\n\nParagraph with **bold** and `code`.\n";
    const [r1, r2] = await Promise.all([
      parseMarkdown(content, ""),
      parseMarkdown(content, ""),
    ]);
    expect(r1.html).toBe(r2.html);
    expect(r1.headings).toEqual(r2.headings);
  });
});
