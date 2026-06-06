/* ============================================================
   PrettifyText — app.js
   All client-side logic: i18n, theming, format detection,
   prettifiers / minifiers, UI interactions.
   ============================================================ */

'use strict';

/* ----------------------------------------------------------
   CONSTANTS
   ---------------------------------------------------------- */
// PayPal donate link (also in index.php for the static anchor)
const PAYPAL_URL = 'https://www.paypal.com/donate/?hosted_button_id=ZABFRXC2P3JQN';
const VERSION    = window.APP_VERSION || '1.0.0';

/* ----------------------------------------------------------
   1. i18n — INTERNATIONALISATION
   Load JSON translation file, apply to DOM via data-i18n attrs.
   ---------------------------------------------------------- */
let translations = {};
let currentLang  = localStorage.getItem('prettify_lang') || 'en';

async function loadTranslations(lang) {
    try {
        const res = await fetch(`i18n/${lang}.json`);
        if (!res.ok) throw new Error('Not found');
        translations = await res.json();
    } catch (e) {
        // Fall back to English if chosen file is missing
        if (lang !== 'en') {
            const res = await fetch('i18n/en.json');
            translations = await res.json();
        }
    }
    applyTranslations();
}

// Return the translation for key, or the key itself as fallback
function t(key) {
    return translations[key] || key;
}

// Walk DOM and update elements that carry data-i18n / data-i18n-placeholder
function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
    });
}

function changeLang(lang) {
    currentLang = lang;
    localStorage.setItem('prettify_lang', lang);
    document.documentElement.lang = lang;
    loadTranslations(lang);
}

/* ----------------------------------------------------------
   2. THEME — dark / light toggle
   Also swaps the highlight.js CSS link so syntax colours match.
   ---------------------------------------------------------- */
let currentTheme = localStorage.getItem('prettify_theme') || 'dark';

function setTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('prettify_theme', theme);

    // Toggle highlight.js stylesheet
    const darkLink  = document.getElementById('hljs-theme-dark');
    const lightLink = document.getElementById('hljs-theme-light');
    if (darkLink && lightLink) {
        darkLink.disabled  = (theme === 'light');
        lightLink.disabled = (theme === 'dark');
    }

    // Update button icon
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    if (btn) btn.title = t(theme === 'dark' ? 'theme_light' : 'theme_dark');

    // Re-highlight output if any text present
    rehighlight();
}

function toggleTheme() { setTheme(currentTheme === 'dark' ? 'light' : 'dark'); }

/* ----------------------------------------------------------
   3. FORMAT AUTO-DETECTION
   Heuristics to guess the format of the raw input text.
   Returns one of the format keys used throughout the app.
   ---------------------------------------------------------- */
function detectFormat(raw) {
    const text = raw.trim();
    if (!text) return 'text';

    // JSON — starts/ends with { } or [ ]
    if (/^[{\[]/.test(text) && /[}\]]$/.test(text)) {
        try { JSON.parse(text); return 'json'; } catch (_) { /* not valid JSON */ }
    }

    // XML — has XML declaration or root tag
    if (/^<\?xml/i.test(text)) return 'xml';

    // HTML — DOCTYPE or common HTML tags
    if (/<!DOCTYPE\s+html/i.test(text) || /<html[\s>]/i.test(text) ||
        /<(body|head|div|p|span|h[1-6])[\s/>]/i.test(text)) return 'html';

    // Generic XML — starts with < and ends with >
    if (/^</.test(text) && />$/.test(text)) return 'xml';

    // SQL keywords at line start
    if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|GRANT|TRUNCATE|WITH)\b/im.test(text)) return 'sql';

    // CSS — property:value pairs inside braces
    if (/[\w-]+\s*:\s*[^;]+;/.test(text) && text.includes('{')) return 'css';

    // YAML — key: value lines without braces (not JSON)
    if (/^[\w-]+:\s/m.test(text) && !text.startsWith('{')) return 'yaml';

    // Base64 — only base64 alphabet, correct padding, length > 20
    if (/^[A-Za-z0-9+/]+=*$/.test(text) && text.length > 20 && text.length % 4 === 0) return 'base64d';

    // URL-encoded — contains %XX sequences
    if (/%[0-9A-Fa-f]{2}/.test(text)) return 'urld';

    // Markdown — headings, bold, list items
    if (/^#{1,6}\s/m.test(text) || /\*\*\w/.test(text) || /^\- \w/m.test(text)) return 'markdown';

    // JavaScript / TypeScript
    if (/(function\s+\w+|const\s+\w+|let\s+\w+|var\s+\w+|\bclass\s+\w+|=>|import\s+{)/.test(text)) return 'javascript';

    return 'text';
}

/* ----------------------------------------------------------
   4. PRETTIFIERS — one function per format
   ---------------------------------------------------------- */

// JSON: parse then re-serialise with 2-space indent
function prettifyJSON(text) {
    try {
        return JSON.stringify(JSON.parse(text), null, 2);
    } catch (e) {
        throw new Error('Invalid JSON: ' + e.message);
    }
}

// XML: DOM parse → recursive pretty-print
function prettifyXML(text) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text.trim(), 'application/xml');
    const err = doc.querySelector('parsererror');
    if (err) throw new Error('Invalid XML: ' + err.textContent.split('\n')[0]);

    // Recursive node serialiser
    function serializeNode(node, depth) {
        const pad = '  '.repeat(depth);

        if (node.nodeType === Node.TEXT_NODE) {
            const v = node.textContent.trim();
            return v ? v : null;
        }
        if (node.nodeType === Node.COMMENT_NODE) {
            return pad + '<!--' + node.textContent + '-->';
        }
        if (node.nodeType === Node.DOCUMENT_NODE) {
            return Array.from(node.childNodes)
                .map(c => serializeNode(c, depth)).filter(Boolean).join('\n');
        }

        const tag   = node.tagName;
        const attrs = Array.from(node.attributes || [])
            .map(a => ` ${a.name}="${a.value}"`).join('');
        const kids  = Array.from(node.childNodes)
            .map(c => serializeNode(c, depth + 1)).filter(Boolean);

        if (kids.length === 0) return `${pad}<${tag}${attrs}/>`;

        // Inline if single short text child
        if (kids.length === 1 && !kids[0].includes('\n') && kids[0].length < 60) {
            return `${pad}<${tag}${attrs}>${kids[0].trim()}</${tag}>`;
        }

        return `${pad}<${tag}${attrs}>\n${kids.join('\n')}\n${pad}</${tag}>`;
    }

    const decl = /^<\?xml/i.test(text.trim()) ? '<?xml version="1.0" encoding="UTF-8"?>\n' : '';
    return decl + serializeNode(doc, 0);
}

// HTML: delegate to js-beautify (loaded via CDN)
function prettifyHTML(text) {
    if (typeof html_beautify === 'undefined') throw new Error('HTML beautifier not loaded yet');
    return html_beautify(text, {
        indent_size: 2,
        preserve_newlines: true,
        max_preserve_newlines: 2,
        wrap_line_length: 120,
        extra_liners: ['head', 'body', '/html'],
    });
}

// CSS: delegate to js-beautify
function prettifyCSS(text) {
    if (typeof css_beautify === 'undefined') throw new Error('CSS beautifier not loaded yet');
    return css_beautify(text, { indent_size: 2, newline_between_rules: true });
}

// JavaScript / TypeScript: delegate to js-beautify
function prettifyJS(text) {
    if (typeof js_beautify === 'undefined') throw new Error('JS beautifier not loaded yet');
    return js_beautify(text, {
        indent_size: 2,
        space_in_empty_paren: true,
        end_with_newline: true,
        preserve_newlines: true,
        max_preserve_newlines: 2,
        jslint_happy: false,
    });
}

// SQL: delegate to sql-formatter (CDN), fallback to keyword-newline
function prettifySQL(text) {
    if (typeof sqlFormatter !== 'undefined') {
        return sqlFormatter.format(text, { language: 'sql', tabWidth: 2, keywordCase: 'upper' });
    }
    // Basic fallback
    return text
        .replace(/\b(SELECT|FROM|WHERE|AND|OR|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|ON|GROUP BY|ORDER BY|HAVING|LIMIT|OFFSET|INSERT INTO|VALUES|UPDATE|SET|DELETE FROM|CREATE TABLE|DROP TABLE|ALTER TABLE)\b/gi,
            '\n$1')
        .split('\n').map(l => l.trim()).filter(Boolean).join('\n');
}

// YAML: parse with js-yaml then dump with 2-space indent
function prettifyYAML(text) {
    if (typeof jsyaml === 'undefined') throw new Error('YAML parser not loaded yet');
    try {
        const obj = jsyaml.load(text);
        return jsyaml.dump(obj, { indent: 2, lineWidth: -1, noRefs: true });
    } catch (e) {
        throw new Error('Invalid YAML: ' + e.message);
    }
}

// Markdown: returned as-is (the raw text IS already formatted)
function prettifyMarkdown(text) { return text.trim(); }

// Base64 → text decode
function decodeBase64(text) {
    try {
        // Handle both standard and URL-safe base64
        const standard = text.trim().replace(/-/g, '+').replace(/_/g, '/');
        return decodeURIComponent(escape(atob(standard)));
    } catch (e) {
        throw new Error('Invalid Base64 — could not decode');
    }
}

// text → Base64 encode
function encodeBase64(text) {
    try {
        return btoa(unescape(encodeURIComponent(text)));
    } catch (e) {
        throw new Error('Could not encode to Base64');
    }
}

// URL-encoded → text decode
function decodeURL(text) {
    try { return decodeURIComponent(text.trim()); }
    catch (e) { throw new Error('Invalid URL encoding'); }
}

// text → URL encode
function encodeURL(text) { return encodeURIComponent(text); }

/* ----------------------------------------------------------
   5. MINIFIERS
   ---------------------------------------------------------- */

function minifyJSON(text) {
    try { return JSON.stringify(JSON.parse(text)); }
    catch (e) { throw new Error('Invalid JSON: ' + e.message); }
}

// Strip comments, collapse whitespace in CSS
function minifyCSS(text) {
    return text
        .replace(/\/\*[\s\S]*?\*\//g, '')  // block comments
        .replace(/\s+/g, ' ')
        .replace(/\s*([{};:,>~+])\s*/g, '$1')
        .trim();
}

// Strip HTML comments, collapse whitespace
function minifyHTML(text) {
    return text
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/\s+/g, ' ')
        .replace(/>\s+</g, '><')
        .trim();
}

// Collapse whitespace for unknown formats
function minifyGeneric(text) {
    return text.replace(/\s+/g, ' ').trim();
}

/* ----------------------------------------------------------
   6. MAIN ACTIONS — prettify() and minify()
   ---------------------------------------------------------- */

function prettify() {
    const input  = document.getElementById('input-text').value;
    const fmtSel = document.getElementById('format-selector').value;

    if (!input.trim()) { showStatus(t('error_empty'), 'error'); return; }

    const fmt = fmtSel === 'auto' ? detectFormat(input) : fmtSel;
    updateFormatBadge(fmt);

    try {
        let result = '', hlLang = fmt;

        switch (fmt) {
            case 'json':       result = prettifyJSON(input);   hlLang = 'json';        break;
            case 'xml':        result = prettifyXML(input);    hlLang = 'xml';         break;
            case 'html':       result = prettifyHTML(input);   hlLang = 'xml';         break;
            case 'css':        result = prettifyCSS(input);    hlLang = 'css';         break;
            case 'javascript': result = prettifyJS(input);     hlLang = 'javascript';  break;
            case 'typescript': result = prettifyJS(input);     hlLang = 'typescript';  break;
            case 'sql':        result = prettifySQL(input);    hlLang = 'sql';         break;
            case 'yaml':       result = prettifyYAML(input);   hlLang = 'yaml';        break;
            case 'markdown':   result = prettifyMarkdown(input); hlLang = 'markdown';  break;
            case 'base64d':    result = decodeBase64(input);   hlLang = 'plaintext';   break;
            case 'base64e':    result = encodeBase64(input);   hlLang = 'plaintext';   break;
            case 'urld':       result = decodeURL(input);      hlLang = 'plaintext';   break;
            case 'urle':       result = encodeURL(input);      hlLang = 'plaintext';   break;
            default:           result = input;                 hlLang = 'plaintext';
        }

        displayOutput(result, hlLang);
        showStatus(t('success_formatted'), 'success');
    } catch (e) {
        showStatus(e.message, 'error');
        displayOutput(e.message, 'plaintext');
    }
}

function minify() {
    const input  = document.getElementById('input-text').value;
    const fmtSel = document.getElementById('format-selector').value;

    if (!input.trim()) { showStatus(t('error_empty'), 'error'); return; }

    const fmt = fmtSel === 'auto' ? detectFormat(input) : fmtSel;

    try {
        let result;
        switch (fmt) {
            case 'json': result = minifyJSON(input);   break;
            case 'css':  result = minifyCSS(input);    break;
            case 'html': result = minifyHTML(input);   break;
            default:     result = minifyGeneric(input);
        }
        displayOutput(result, fmt);
        showStatus(t('success_minified'), 'success');
    } catch (e) {
        showStatus(e.message, 'error');
    }
}

/* ----------------------------------------------------------
   7. OUTPUT RENDERING
   ---------------------------------------------------------- */

// Write code to the output panel and apply syntax highlighting
function displayOutput(text, lang) {
    const codeEl = document.getElementById('output-code');
    codeEl.textContent = text;
    codeEl.className   = `language-${lang}`;

    if (typeof hljs !== 'undefined' && lang !== 'plaintext' && lang !== 'text') {
        // hljs.highlightElement modifies the element in-place
        try { hljs.highlightElement(codeEl); } catch (_) { /* ignore */ }
    }

    updateStats('output', text);
}

// Re-run highlight on the current output (called after theme change)
function rehighlight() {
    const codeEl = document.getElementById('output-code');
    if (!codeEl || !codeEl.textContent.trim()) return;
    if (typeof hljs === 'undefined') return;
    const lang = (codeEl.className.match(/language-(\S+)/) || [])[1] || '';
    if (lang && lang !== 'plaintext') {
        codeEl.removeAttribute('data-highlighted');
        try { hljs.highlightElement(codeEl); } catch (_) { /* ignore */ }
    }
}

/* ----------------------------------------------------------
   8. UI HELPERS
   ---------------------------------------------------------- */

// Show char / line count in a panel footer
function updateStats(panel, text) {
    const el = document.getElementById(`${panel}-stats`);
    if (!el) return;
    const chars = text.length.toLocaleString();
    const lines = text.split('\n').length.toLocaleString();
    el.textContent = `${chars} ${t('chars')} | ${lines} ${t('lines')}`;
}

// Show or hide the detected-format badge in the output header
function updateFormatBadge(fmt) {
    const badge = document.getElementById('format-detected');
    if (badge) badge.textContent = fmt.toUpperCase();
}

// Temporary status message in the status bar
function showStatus(msg, type = 'info') {
    const bar = document.getElementById('status-bar');
    if (!bar) return;
    bar.textContent  = msg;
    bar.className    = `status-bar ${type}`;
    clearTimeout(bar._timer);
    bar._timer = setTimeout(() => {
        bar.textContent = '';
        bar.className   = 'status-bar';
    }, 3500);
}

// Copy output text to clipboard
function copyOutput() {
    const text = document.getElementById('output-code').textContent;
    if (!text.trim()) return;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(text)
            .then(() => showStatus(t('copied'), 'success'))
            .catch(() => fallbackCopy(text));
    } else {
        fallbackCopy(text);
    }
}

// execCommand fallback for older browsers / http:// contexts
function fallbackCopy(text) {
    const ta = Object.assign(document.createElement('textarea'), {
        value: text, style: 'position:fixed;opacity:0'
    });
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showStatus(t('copied'), 'success');
}

// Move output text back to input (for chained operations)
function swapPanels() {
    const inputEl  = document.getElementById('input-text');
    const outputEl = document.getElementById('output-code');
    const outText  = outputEl.textContent;
    inputEl.value  = outText;
    updateStats('input', outText);
    outputEl.textContent = '';
    outputEl.className   = 'plaintext';
    document.getElementById('output-stats').textContent = `0 ${t('chars')} | 0 ${t('lines')}`;
    document.getElementById('format-detected').textContent = '';
    inputEl.focus();
}

// Clear both panels
function clearAll() {
    document.getElementById('input-text').value  = '';
    document.getElementById('output-code').textContent = '';
    document.getElementById('output-code').className   = 'plaintext';
    ['input', 'output'].forEach(p => {
        document.getElementById(`${p}-stats`).textContent = `0 ${t('chars')} | 0 ${t('lines')}`;
    });
    document.getElementById('format-detected').textContent = '';
    document.getElementById('status-bar').textContent = '';
    document.getElementById('status-bar').className   = 'status-bar';
    document.getElementById('input-text').focus();
}

// Open / close About modal
function openAbout()  { document.getElementById('about-modal').classList.remove('hidden'); }
function closeAbout() { document.getElementById('about-modal').classList.add('hidden'); }

/* ----------------------------------------------------------
   9. EVENT WIRING — runs after DOM ready
   ---------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', async () => {
    // Apply persisted theme immediately (before paint)
    setTheme(currentTheme);

    // Load translations
    await loadTranslations(currentLang);

    // Sync language selector to saved preference
    const langSel = document.getElementById('lang-switcher');
    if (langSel) langSel.value = currentLang;

    /* --- Button click handlers --- */
    document.getElementById('btn-prettify').addEventListener('click', prettify);
    document.getElementById('btn-minify').addEventListener('click', minify);
    document.getElementById('btn-swap').addEventListener('click', swapPanels);
    document.getElementById('btn-clear').addEventListener('click', clearAll);
    document.getElementById('btn-copy').addEventListener('click', copyOutput);
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('btn-about').addEventListener('click', openAbout);
    document.getElementById('close-modal').addEventListener('click', closeAbout);

    // Close modal when clicking the dark overlay
    document.getElementById('about-modal').addEventListener('click', e => {
        if (e.target === document.getElementById('about-modal')) closeAbout();
    });

    // Language switcher
    if (langSel) langSel.addEventListener('change', e => changeLang(e.target.value));

    /* --- Input textarea: live stats + live auto-detect badge --- */
    const inputEl = document.getElementById('input-text');
    inputEl.addEventListener('input', e => {
        updateStats('input', e.target.value);
        if (document.getElementById('format-selector').value === 'auto') {
            const det = detectFormat(e.target.value);
            updateFormatBadge(det);
        }
    });

    // Keyboard shortcuts
    inputEl.addEventListener('keydown', e => {
        if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); prettify(); }  // Ctrl+Enter → Prettify
        if (e.ctrlKey && e.key === 'm')     { e.preventDefault(); minify(); }    // Ctrl+M    → Minify
    });

    // Escape key closes modal
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeAbout();
    });

    /* --- Drag-and-drop text / files onto input --- */
    inputEl.addEventListener('dragover', e => { e.preventDefault(); inputEl.style.outline = '2px dashed var(--primary)'; });
    inputEl.addEventListener('dragleave', () => { inputEl.style.outline = ''; });
    inputEl.addEventListener('drop', e => {
        e.preventDefault();
        inputEl.style.outline = '';
        const file = e.dataTransfer.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = ev => {
                inputEl.value = ev.target.result;
                updateStats('input', ev.target.result);
            };
            reader.readAsText(file);
        } else {
            const text = e.dataTransfer.getData('text');
            if (text) { inputEl.value = text; updateStats('input', text); }
        }
    });

    // Initialise highlight.js (configure for common languages only to keep it lean)
    if (typeof hljs !== 'undefined') {
        hljs.configure({ ignoreUnescapedHTML: true });
    }

    // Restore format selector to 'auto' each session (clean slate)
    document.getElementById('format-selector').value = 'auto';
});
