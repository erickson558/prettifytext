# PrettifyText — Software Design Document (SDD)
**Version:** 1.0.0 | **Author:** Synyster Rick | **Date:** 2026-06-06

---

## 1. Overview

PrettifyText is a single-page PHP web application that lets users paste raw text in any
known format and have it instantly reformatted (prettified), minified, or transformed.
All heavy formatting runs client-side via JavaScript; the PHP backend provides a
server-authoritative fallback and a clean HTML shell.

---

## 2. Goals

| # | Goal |
|---|------|
| G1 | Support all common text/code formats: JSON, HTML, XML, CSS, JS/TS, SQL, YAML, Markdown, Base64, URL |
| G2 | Instant, client-side formatting — no page reload |
| G3 | Dual theme (dark / light) with persisted preference |
| G4 | Multi-language UI (EN / ES; extensible) |
| G5 | "Buy me a beer" PayPal donation button |
| G6 | GitHub release automation via GitHub Actions |
| G7 | Clean, maintainable codebase with commented sections |

---

## 3. User Stories

| ID | As a… | I want to… | So that… |
|----|-------|-----------|---------|
| US-01 | Developer | Paste JSON and get it prettified | I can read it quickly |
| US-02 | Developer | Minify CSS/HTML | I can prepare it for production |
| US-03 | Developer | Decode a Base64 string | I can inspect API payloads |
| US-04 | User | Switch between English and Spanish | I can use the app in my language |
| US-05 | User | Toggle dark/light mode | I can use the app comfortably |
| US-06 | User | Drag-and-drop a file | I can format file contents without copy-paste |
| US-07 | User | Copy the formatted output | I can use it right away |
| US-08 | User | Swap input ↔ output | I can chain transformations |
| US-09 | Supporter | Click "Buy me a beer" | I can donate to the author |

---

## 4. Functional Requirements

### 4.1 Supported Formats

| Format | Prettify | Minify | Notes |
|--------|----------|--------|-------|
| JSON | ✓ | ✓ | `JSON.parse` + `JSON.stringify(…, null, 2)` |
| HTML | ✓ | ✓ | js-beautify / regex strip |
| XML | ✓ | — | DOM recursive formatter |
| CSS | ✓ | ✓ | js-beautify / regex strip |
| JavaScript | ✓ | — | js-beautify |
| TypeScript | ✓ | — | js-beautify (JS mode) |
| SQL | ✓ | — | sql-formatter CDN |
| YAML | ✓ | — | js-yaml parse+dump |
| Markdown | ✓ | — | Pass-through (raw IS the format) |
| Base64 | Decode | — | `atob()` |
| Base64 | Encode | — | `btoa()` |
| URL | Decode | — | `decodeURIComponent()` |
| URL | Encode | — | `encodeURIComponent()` |

### 4.2 Auto-Detection

Heuristics checked in priority order:
1. JSON (structural `{}` or `[]` + valid parse)
2. XML (starts with `<?xml`)
3. HTML (DOCTYPE / common tags)
4. Generic XML (starts with `<` ends with `>`)
5. SQL (leading keyword)
6. CSS (property:value + braces)
7. YAML (key: value, no braces)
8. Base64 (alphabet + padding + length)
9. URL-encoded (`%XX` sequences)
10. Markdown (headings / bold / lists)
11. JavaScript (common patterns)

### 4.3 UI Interactions

- **Ctrl+Enter** → Prettify
- **Ctrl+M** → Minify
- **Drag-and-drop** file onto input textarea → read as text
- Status bar message auto-clears after 3.5 s
- Format badge in output header shows detected/selected format

---

## 5. Non-Functional Requirements

| ID | Requirement |
|----|------------|
| NFR-01 | No server round-trip required for formatting (all client-side) |
| NFR-02 | Page loads in < 2 s on a standard connection |
| NFR-03 | Works in Chrome, Firefox, Edge (latest 2 versions) |
| NFR-04 | Responsive: usable on screens ≥ 360px wide |
| NFR-05 | No tracking, cookies, or external analytics |
| NFR-06 | XSS-safe: user text never interpreted as HTML (always `textContent`) |

---

## 6. Architecture

```
prettifytext/
├── index.php              ← PHP shell: reads VERSION, renders HTML
├── api/
│   └── prettify.php       ← POST endpoint (server-side fallback)
├── frontend/
│   ├── css/style.css      ← All styles, CSS variables theming
│   └── js/app.js          ← All client logic (i18n, formatters, UI)
├── i18n/
│   ├── en.json            ← English strings
│   └── es.json            ← Spanish strings
├── .github/workflows/
│   └── release.yml        ← GitHub Actions: release on push to main
├── CLAUDE.md              ← Claude Code project config + agents
├── SDD.md                 ← This document
├── README.md
├── CHANGELOG.md
└── VERSION                ← Single source of truth for version
```

### Data Flow (prettify operation)

```
User pastes text
      │
      ▼
format-selector (auto | explicit)
      │
      ├─ auto → detectFormat() heuristics
      │
      ▼
prettify() / minify()
      │
      ├─ JSON   → JSON.parse + stringify
      ├─ HTML   → html_beautify()
      ├─ XML    → DOM recursive serialiser
      ├─ CSS    → css_beautify()
      ├─ JS/TS  → js_beautify()
      ├─ SQL    → sqlFormatter.format()
      ├─ YAML   → jsyaml.load + dump
      └─ B64/URL→ atob / btoa / encodeURIComponent
             │
             ▼
      displayOutput() → hljs.highlightElement()
             │
             ▼
      Output panel updated
```

---

## 7. i18n Strategy

- Translations stored as `i18n/{lang}.json`
- Loaded at startup via `fetch()` (async)
- Applied via `data-i18n` / `data-i18n-placeholder` DOM attributes
- Language preference persisted in `localStorage`
- Fallback: if a key is missing, the key itself is shown
- Adding a new language = add `i18n/{code}.json` + an `<option>` in `#lang-switcher`

---

## 8. Theme Strategy

- CSS variables declared in `:root` (dark defaults)
- `[data-theme="light"]` block overrides each variable
- `data-theme` attribute toggled on `<html>`
- Preference persisted in `localStorage`
- highlight.js theme CSS link swapped (atom-one-dark ↔ atom-one-light)

---

## 9. Security Considerations

| Risk | Mitigation |
|------|-----------|
| XSS via user input | All output written via `element.textContent` — never `innerHTML` |
| API injection | `api/prettify.php` whitelists format keys; no shell execution |
| CORS | API returns permissive CORS only — no sensitive data served |
| Error leak | PHP errors suppressed via `libxml_use_internal_errors(true)` |

---

## 10. Versioning

- Format: `MAJOR.MINOR.PATCH` (semver)
- Single source of truth: `VERSION` file
- PHP reads it at runtime; JS reads `window.APP_VERSION` injected by PHP
- Git tag matches version on each release
- GitHub Actions creates a release automatically on push to `main`

---

## 11. Release Checklist

- [ ] Bump `VERSION`
- [ ] Update `CHANGELOG.md`
- [ ] Commit: `chore(release): bump version to Vx.x.x`
- [ ] Push to `main` → GitHub Actions auto-creates release
