# /php-master — PHP Master Prompt Skill

Apply senior PHP engineering best practices to any file in this project.
Adapted from the Python Master Prompt for PHP + web applications.

## What this skill does

Analyze the specified file (or the whole project) and improve it without
breaking existing functionality. Deliver a complete updated file, not fragments.

## Checklist applied automatically

### Architecture
- [ ] Clear separation: `index.php` (presentation) vs `api/` (logic) vs `frontend/` (client)
- [ ] No business logic inside the HTML shell
- [ ] Functions are small and single-responsibility

### Security
- [ ] All user input echoed via `htmlspecialchars()` with `ENT_QUOTES`
- [ ] No `shell_exec`, `exec`, `system`, `passthru` with user data
- [ ] No `eval()` with user data
- [ ] `libxml_use_internal_errors(true)` for XML parsing (no leaking libxml errors)
- [ ] API endpoint whitelists allowed format keys before processing
- [ ] No credentials hardcoded in source

### Code Quality
- [ ] PHP 7.4+ typed where practical
- [ ] Errors handled without exposing stack traces to client
- [ ] `json_last_error_msg()` used for JSON error details
- [ ] No `@` error suppression except where `libxml` requires it
- [ ] Constants `JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES` on output

### Frontend (JS / CSS)
- [ ] `'use strict'` at top of every JS file
- [ ] `const` / `let` only — no `var`
- [ ] All user text via `element.textContent` — never `innerHTML`
- [ ] CSS colours use `var(--token)` — no raw hex outside `:root`
- [ ] `async/await` for all async operations

### Versioning & Docs
- [ ] `VERSION` file is the single source of truth
- [ ] `CHANGELOG.md` updated
- [ ] `SDD.md` updated if architecture changes

## About block

Every `About` modal / dialog must contain:
```
PrettifyText {version}
Creado por Synyster Rick
{year} Todos los Derechos Reservados
```

## Process

1. Read the target file(s)
2. Report: what it does, what can improve, what must not change
3. Propose the improved version
4. Apply only after user confirms
5. Bump `VERSION` patch digit if logic changed
6. Run `/push-github` if user approves

## PayPal Donation Button

Always present in footer and About modal:
```html
<a href="https://www.paypal.com/donate/?hosted_button_id=ZABFRXC2P3JQN"
   target="_blank" rel="noopener" class="btn-beer">
    🍺 Buy me a beer
</a>
```
