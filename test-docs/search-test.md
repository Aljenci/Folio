# Search Test Document

This file is designed to test **in-document search**. It contains deliberate repetition of words and phrases, regex-special characters, and edge cases.

---

## JavaScript Basics

JavaScript is a lightweight, interpreted programming language with first-class functions. JavaScript was first introduced in 1995 and has become the most widely used programming language on the web. Modern JavaScript supports classes, modules, async/await, and much more.

When learning JavaScript, start with variables and data types. JavaScript has `var`, `let`, and `const` for variable declarations. Understanding how JavaScript handles scope is fundamental.

```javascript
// A simple JavaScript example
const greet = (name) => `Hello, ${name}!`;
console.log(greet('World'));
```

---

## TypeScript and Type Safety

TypeScript is a typed superset of JavaScript. TypeScript adds optional static typing to JavaScript. Many large projects have migrated from JavaScript to TypeScript for better tooling and safety.

The TypeScript compiler (`tsc`) checks types at compile time and transpiles TypeScript to JavaScript. TypeScript interfaces, generics, and utility types make it a powerful tool.

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

function getUser(id: number): User {
  return { id, name: 'Alice', email: 'alice@example.com' };
}
```

---

## Regex-Special Character Tests

These phrases contain characters that would break a naive `new RegExp(query)` — verify that searching for them works without crashing and shows "No matches" (they don't appear literally elsewhere):

| Search this | Expected |
|---|---|
| `a+b` | No matches (or finds literal "a+b" in this table) |
| `file.md` | No matches (or finds literal occurrences) |
| `[test]` | No matches |
| `(group)` | No matches |
| `price $5` | No matches |
| `c:\path\to` | No matches |
| `a{2,4}` | No matches |
| `^anchor` | No matches |

The escaped string `a+b` and the path `file.md` and the pattern `[test]` should all be treated as **literal text**, not regex syntax.

---

## Repeated Phrases for Navigation Testing

The word **navigation** appears multiple times in this document. Use it to test match count and next/prev navigation.

Good navigation design is invisible — users move through content without thinking about the mechanism. Poor navigation design makes users feel lost.

The key to great navigation is hierarchy. Navigation should mirror the structure of the content. Flat navigation works for small sites; hierarchical navigation scales to large documents.

Testing navigation with a search tool: open search, type "navigation", verify the count shows "1 of N", then press Enter repeatedly to cycle through all occurrences of navigation.

The word navigation appears here one more time to ensure you have at least 6 occurrences total.

---

## Case Sensitivity Test

Search for `JAVASCRIPT` (all caps) — it should match the same occurrences as `javascript` (lowercase). Search is case-insensitive.

Search for `Javascript` (title case) — same result.

---

## Empty Query Behaviour

Clear the search input completely. There should be:
- No highlight marks in the document
- No match count displayed
- No error or crash

---

## Unicode and Special Text

Search for `日本語` — should work without crash (no matches expected unless you add Japanese text).

Search for emoji `🚀` — should show "No matches", no crash.

---

## Code Block Search

The word `console` appears inside the code block above. Search for `console` and verify it highlights both the occurrence in the code block and any in prose.
