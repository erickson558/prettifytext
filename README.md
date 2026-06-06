# PrettifyText

> Format & beautify any code instantly — JSON, HTML, XML, CSS, JS, SQL, YAML, Markdown, Base64, URL and more.

**Version:** 1.0.0 | **Author:** Synyster Rick | **License:** Apache 2.0

[![Release](https://github.com/erickson558/prettifytext/actions/workflows/release.yml/badge.svg)](https://github.com/erickson558/prettifytext/actions/workflows/release.yml)

---

## Features

| Feature | Details |
|---------|---------|
| 11 formats | JSON · HTML · XML · CSS · JS · TypeScript · SQL · YAML · Markdown · Base64 · URL |
| Auto-detect | Guesses format from pasted text |
| Prettify & Minify | Both directions supported where applicable |
| Dark / Light theme | Toggled per-session, persisted |
| Multi-language | English and Spanish UI |
| Keyboard shortcuts | `Ctrl+Enter` prettify · `Ctrl+M` minify |
| Drag & drop | Drop a text file onto the input panel |
| Syntax highlight | highlight.js — matches chosen theme |
| No tracking | Zero analytics, zero cookies |
| Donate | PayPal "Buy me a beer" button |

---

## Requirements

- PHP 7.4 or newer (7.4 / 8.0 / 8.1 / 8.2)
- A web server (Apache / Nginx / EasyPHP)
- Modern browser (Chrome, Firefox, Edge — latest 2 versions)
- Internet access to load CDN libraries (highlight.js, js-beautify, etc.)

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/erickson558/prettifytext.git

# 2. Place the folder inside your web server's document root, e.g.:
#    C:\EasyPHP\www\   or   /var/www/html/

# 3. Open in browser
http://localhost/prettifytext/
```

No Composer dependencies. No npm build step. Drop and go.

---

## Project Structure

```
prettifytext/
├── index.php              ← PHP shell (entry point)
├── api/
│   └── prettify.php       ← Server-side formatting API (POST)
├── frontend/
│   ├── css/style.css      ← All styles + dark/light theme
│   └── js/app.js          ← All client logic
├── i18n/
│   ├── en.json            ← English strings
│   └── es.json            ← Spanish strings
├── .github/workflows/
│   └── release.yml        ← Auto-release on push to main
├── CLAUDE.md              ← Claude Code agent + skill config
├── SDD.md                 ← Software Design Document
├── CHANGELOG.md
├── VERSION
└── README.md
```

---

## Adding a New Language

1. Copy `i18n/en.json` → `i18n/{code}.json`
2. Translate all values (keep all keys)
3. Add `<option value="{code}">🏳️ LANG</option>` to `#lang-switcher` in `index.php`
4. Done — the i18n system picks it up automatically

---

## Adding a New Format

1. Write a `prettifyFOO(text)` function in `frontend/js/app.js`
2. Add a `case 'foo':` in the `prettify()` switch
3. Add heuristic in `detectFormat()` if auto-detectable
4. Add `<option value="foo">FOO</option>` in `index.php`
5. Add `"format_foo": "..."` to `i18n/en.json` and `i18n/es.json`
6. Update `SDD.md` format table

---

## Release Process

Handled automatically by GitHub Actions (`release.yml`):

1. Bump `VERSION` (e.g. `1.0.1`)
2. Update `CHANGELOG.md`
3. `git commit -m "chore(release): bump version to V1.0.1"`
4. `git push origin main --tags`
5. GitHub Actions creates the release with a ZIP attachment

---

## Donate

If this tool saves you time, buy me a beer! 🍺

[![Donate](https://img.shields.io/badge/PayPal-Donate-blue)](https://www.paypal.com/donate/?hosted_button_id=ZABFRXC2P3JQN)

---

## License

Apache License 2.0 — see [LICENSE](LICENSE) for details.

© 2026 Synyster Rick. All Rights Reserved.
