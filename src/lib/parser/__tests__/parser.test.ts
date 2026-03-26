import { describe, it, expect } from "vitest";
import { parseMarkdown } from "../index";

describe("parseMarkdown", () => {
  it("renders a basic heading", async () => {
    const { html } = await parseMarkdown("# Hello");
    expect(html).toContain("<h1");
    expect(html).toContain("Hello");
  });

  it("strips YAML front matter and exposes it separately", async () => {
    const input = `---\ntitle: Test\ndate: 2024-01-01\n---\n\n# Content`;
    const { html, frontMatter } = await parseMarkdown(input);
    expect(frontMatter.title).toBe("Test");
    expect(html).not.toContain("---");
    expect(html).toContain("Content");
  });

  it("renders GFM tables", async () => {
    const input = `| A | B |\n|---|---|\n| 1 | 2 |`;
    const { html } = await parseMarkdown(input);
    expect(html).toContain("<table");
    expect(html).toContain("<th");
    expect(html).toContain("<td");
  });

  it("renders GFM task list checkboxes", async () => {
    const input = `- [x] Done\n- [ ] Todo`;
    const { html } = await parseMarkdown(input);
    expect(html).toContain('type="checkbox"');
  });

  it("renders GFM strikethrough", async () => {
    const { html } = await parseMarkdown("~~strike~~");
    expect(html).toContain("<del");
  });

  it("adds slug ids to headings via rehype-slug", async () => {
    const { html } = await parseMarkdown("## My Section");
    expect(html).toContain('id="my-section"');
  });

  it("preserves heading ids after sanitization", async () => {
    const { html } = await parseMarkdown("### Another Heading");
    expect(html).toMatch(/id="another-heading"/);
  });

  it("sanitizes script tags (XSS prevention)", async () => {
    const input = `<script>alert("xss")</script>\n\n# Safe`;
    const { html } = await parseMarkdown(input);
    expect(html).not.toContain("<script");
    expect(html).toContain("Safe");
  });

  it("sanitizes onerror attributes", async () => {
    const input = `<img src="x" onerror="alert(1)">`;
    const { html } = await parseMarkdown(input);
    expect(html).not.toContain("onerror");
  });

  it("handles an empty string", async () => {
    const { html, headings } = await parseMarkdown("");
    expect(html).toBe("");
    expect(headings).toHaveLength(0);
  });

  it("returns empty frontMatter for documents without front matter", async () => {
    const { frontMatter } = await parseMarkdown("# Just a heading");
    expect(Object.keys(frontMatter)).toHaveLength(0);
  });

  it("extracts headings with correct levels and text", async () => {
    const input = `# H1\n\n## H2\n\n### H3`;
    const { headings } = await parseMarkdown(input);
    expect(headings).toHaveLength(3);
    expect(headings[0]).toMatchObject({ level: 1, text: "H1" });
    expect(headings[1]).toMatchObject({ level: 2, text: "H2" });
    expect(headings[2]).toMatchObject({ level: 3, text: "H3" });
  });

  it("renders inline code", async () => {
    const { html } = await parseMarkdown("`const x = 1`");
    expect(html).toContain("<code");
    expect(html).toContain("const x = 1");
  });

  it("renders fenced code blocks with pre+code", async () => {
    const input = "```js\nconsole.log('hello');\n```";
    const { html } = await parseMarkdown(input);
    expect(html).toContain("<pre");
    expect(html).toContain("<code");
    // Shiki tokenizes identifiers individually, so check for 'console' and 'log' separately
    expect(html).toContain("console");
    expect(html).toContain("log");
  });

  it("renders blockquotes", async () => {
    const { html } = await parseMarkdown("> A quote");
    expect(html).toContain("<blockquote");
  });

  it("renders horizontal rules", async () => {
    // Use "***" to avoid gray-matter treating a leading "---" as front matter
    const { html } = await parseMarkdown("paragraph\n\n***");
    expect(html).toContain("<hr");
  });

  it("returns empty headings array when document has no headings", async () => {
    const { headings } = await parseMarkdown("Just a paragraph with no headings.");
    expect(headings).toHaveLength(0);
  });
});
