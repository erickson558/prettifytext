# PrettifyText — Claude Code Project Configuration

## Project Summary

PHP + Vanilla JS web app that prettifies / minifies any text format (JSON, HTML, XML,
CSS, JS, SQL, YAML, Markdown, Base64, URL).  See `SDD.md` for full specifications.

## Stack

- **Backend:** PHP 7.4+ (EasyPHP / Apache)
- **Frontend:** Vanilla JS ES2020, CSS custom properties
- **Libraries (CDN):** highlight.js 11, js-beautify 1.15, js-yaml 4, marked 9, sql-formatter 15
- **CI/CD:** GitHub Actions → auto-release on push to `main`
- **Repo:** `erickson558/prettifytext` on GitHub

## Key Files

| File | Purpose |
|------|---------|
| `index.php` | PHP shell — reads VERSION, renders full HTML page |
| `frontend/js/app.js` | All client logic: i18n, theme, formatters, UI |
| `frontend/css/style.css` | All styles, dark/light theme via CSS variables |
| `api/prettify.php` | POST endpoint for server-side formatting |
| `i18n/en.json` / `es.json` | Translation strings |
| `VERSION` | Semver version string (single source of truth) |
| `SDD.md` | Software Design Document — read before changing architecture |

## Agents

### prettify-dev (default development agent)

Role: full-stack developer for PrettifyText.

**Responsibilities:**
- Implement new format handlers in `frontend/js/app.js`
- Update CSS in `frontend/css/style.css`
- Keep `SDD.md` in sync with any architectural changes
- Bump `VERSION` and `CHANGELOG.md` for every meaningful change
- Use `/push-github` after completing a feature

**Rules:**
1. Never use `innerHTML` with user content — always `textContent` (XSS prevention)
2. All new format keys must be added to both `i18n/en.json` AND `i18n/es.json`
3. Version in `VERSION` file is the single source of truth
4. CDN library versions are pinned — do not bump without testing

## Skills Available

| Command | Description |
|---------|-------------|
| `/push-github` | Bump version, commit, push, create GitHub release |
| `/comment-code` | Add explanatory comments to the current file |
| `/php-master` | Apply PHP master-prompt best practices to current code |

## Coding Standards

- **Comments:** Only where the *why* is non-obvious. No narration of what the code does.
- **CSS:** All colours via CSS variables. No hardcoded hex except in `:root` / theme blocks.
- **JS:** `'use strict'`. Prefer `const`/`let`. No jQuery or heavy frameworks.
- **PHP:** `htmlspecialchars()` every variable echoed into HTML. No shell_exec.
- **i18n:** Every user-facing string must have a translation key in both JSON files.

## How to Add a New Format

1. Add a prettifier function `prettifyFOO(text)` in `app.js`
2. Add a `case 'foo':` in the `prettify()` switch
3. Add format detection heuristic in `detectFormat()` if auto-detectable
4. Add `<option value="foo">` to `#format-selector` in `index.php`
5. Add `"format_foo": "..."` key to `i18n/en.json` and `i18n/es.json`
6. Update `SDD.md` supported-formats table
7. Run `/push-github`
