---
title: Front Matter Test
author: Folio Test Suite
date: 2024-01-15
tags: [m0, testing, yaml]
version: 1.0.0
---

# Front Matter Stripping Test

**What to verify:** The YAML block above (lines 1–7 between `---` markers) must **not** appear anywhere in the rendered output. You should only see this heading and the content below.

If the YAML is visible in the rendered document, front matter stripping is broken.

---

## Expected Rendered Output

You should see:
- This heading (`# Front Matter Stripping Test`)
- This explanation paragraph
- This `Expected Rendered Output` section
- The list below

You should **not** see:
- `title: Front Matter Test`
- `author: Folio Test Suite`
- `date: 2024-01-15`
- Any `---` delimiters from the front matter block

---

## Additional Content

This paragraph ensures the document has enough content to confirm the parser continued normally after stripping front matter — the rest of the document renders correctly.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Everything after the front matter block is normal Markdown and should render as styled HTML.
