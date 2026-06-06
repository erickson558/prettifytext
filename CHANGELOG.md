# Changelog — PrettifyText

All notable changes to this project will be documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versions follow [Semantic Versioning](https://semver.org/).

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
