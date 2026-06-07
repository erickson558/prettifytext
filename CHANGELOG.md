# Changelog — PrettifyText

All notable changes to this project will be documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versions follow [Semantic Versioning](https://semver.org/).

---

## [1.0.2] — 2026-06-06

### Fixed
- Center action buttons (Prettify / Minify / Swap / Clear) no longer disappear.
  Root cause: `min-width: max-content` on the output editor-area was expanding the
  CSS Grid beyond available space. Fixed with `min-width: 0` on `.panel-body` and
  `.output-scroll` to contain flex expansion within the grid cell.
- PC no longer freezes when pasting large files:
  - Line-number gutter updates are now **debounced** (120 ms) — rapid typing/paste
    no longer triggers a rebuild on every character.
  - Files > 3 000 lines use a fast plain-text render instead of per-span DOM nodes.
  - Files > 50 000 lines show a "50 000+" indicator — no attempt to render 50 k spans.
  - Files > 2 MB skip the line-split scan entirely to avoid O(n) string operations.
  - Paste handler defers gutter rebuild to `requestAnimationFrame` so the browser
    finishes inserting text before scanning it.
- Both panels now show **always-visible scrollbars** (`overflow: scroll`) — users
  can scroll back after pasting long text without hunting for a scrollbar handle.

---

## [1.0.1] — 2026-06-06

### Added
- Line-number gutter on both input and output panels (Notepad++ style)
- Active-line highlight in input gutter follows cursor position
- Gutter auto-widens when line count crosses digit boundaries (9→99→999…)
- Horizontal scroll in output keeps gutter sticky (position: sticky left)
- Input gutter scroll synchronized to textarea vertical scroll

---

## [1.0.0] — 2026-06-06

### Added
- Initial release of PrettifyText
- Format support: JSON, HTML, XML, CSS, JavaScript, TypeScript, SQL, YAML, Markdown
- Encoding tools: Base64 encode/decode, URL encode/decode
- Auto-detect format from pasted text (heuristics)
- Minify support: JSON, HTML, CSS, generic whitespace collapse
- Dark / light theme toggle (persisted in localStorage)
- Multi-language UI: English 🇺🇸 and Spanish 🇪🇸
- Drag-and-drop file onto input textarea
- Copy output to clipboard (Clipboard API + execCommand fallback)
- Swap input ↔ output panels
- Live character and line count on both panels
- Keyboard shortcut: Ctrl+Enter (prettify), Ctrl+M (minify)
- PayPal "Buy me a beer" donation button
- About modal with version, author, and donation link
- PHP server-side API endpoint (`api/prettify.php`) for JSON, XML, Base64, URL
- GitHub Actions workflow: auto-release on push to `main`
- Syntax highlighting via highlight.js (atom-one-dark / atom-one-light)
- Software Design Document (`SDD.md`)
- Claude Code project config (`CLAUDE.md`) with agents and custom skills
