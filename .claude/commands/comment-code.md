# /comment-code — Code Commenting Skill

Add clear, useful comments to the current file so that any developer can understand
*why* each section exists and what subtle invariants or decisions were made.

## Rules

- Comment the **WHY**, not the WHAT. Well-named code already says what it does.
- One short line max per block — no multi-paragraph docstrings.
- Note hidden constraints, workarounds, or non-obvious invariants.
- Do **not** add comments that say things like:
  - `// calls JSON.parse` (obvious from the code)
  - `// loop over items` (obvious)
- Do add comments like:
  - `// Must use textContent not innerHTML — user input, XSS risk`
  - `// strict base64 decode — rejects non-alphabet chars`
  - `// hljs.highlightElement mutates the element; remove data-highlighted to re-run`

## Process

1. Read the file the user has open (or the file they specify)
2. Identify sections that lack comments and have non-obvious logic
3. Propose comments inline, showing the before/after diff
4. Ask the user to approve before writing
5. Write the updated file

## Scope

Works on any file in this project:
- `frontend/js/app.js` — JS formatters and UI logic
- `frontend/css/style.css` — CSS architecture notes
- `api/prettify.php` — PHP endpoint reasoning
- `index.php` — PHP shell decisions

## Example

**Before:**
```javascript
codeEl.removeAttribute('data-highlighted');
hljs.highlightElement(codeEl);
```

**After:**
```javascript
// hljs marks elements it has already processed with data-highlighted.
// Removing the attr forces it to re-run when the theme changes.
codeEl.removeAttribute('data-highlighted');
hljs.highlightElement(codeEl);
```
