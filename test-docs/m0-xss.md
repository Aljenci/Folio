# XSS Prevention Test

**What to verify:** This document contains several XSS attack vectors. None of them should execute. No alerts should appear, no scripts should run, no event handlers should fire.

Open DevTools (F12 or right-click → Inspect) and check the Elements panel — none of the dangerous tags or attributes below should appear in the DOM.

---

## Test 1: Script tag (must be stripped)

The following should render as plain text or be completely absent — not execute:

<script>alert('XSS: script tag executed!')</script>

---

## Test 2: Inline event handler (must be stripped)

<img src="x" onerror="alert('XSS: onerror fired!')" alt="broken image">

<a href="#" onclick="alert('XSS: onclick fired!')">This link has an onclick</a>

---

## Test 3: JavaScript URL (must be stripped or neutralised)

<a href="javascript:alert('XSS: javascript: URL executed!')">javascript: link</a>

---

## Test 4: Style injection (must be stripped)

<p style="background:url('javascript:alert(1)')">Styled paragraph</p>

---

## Pass Criteria

✅ **PASS** if: No alerts appear, no scripts execute, the page renders normally.

❌ **FAIL** if: Any `alert()` dialog appears, or DevTools shows `<script>` tags or `onerror`/`onclick` attributes in the rendered DOM.
