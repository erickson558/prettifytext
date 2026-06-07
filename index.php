<?php
/* ============================================================
   PrettifyText — index.php
   Entry point: loads version, renders the full SPA shell.
   All formatting logic lives in frontend/js/app.js.
   ============================================================ */
$version = trim(file_get_contents(__DIR__ . '/VERSION'));
$year    = date('Y');
?>
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PrettifyText v<?= htmlspecialchars($version) ?></title>
    <meta name="description" content="Format and beautify JSON, HTML, XML, CSS, SQL, YAML, Markdown and more — instantly.">

    <!-- Syntax highlighting theme (dark) — swapped via JS for light mode -->
    <link id="hljs-theme-dark"  rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
    <link id="hljs-theme-light" rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-light.min.css" disabled>

    <!-- Application styles -->
    <link rel="stylesheet" href="frontend/css/style.css">
</head>
<body>

<!-- ===================== HEADER ===================== -->
<header class="app-header">
    <div class="logo">
        <span class="logo-icon">✦</span>
        <span>PrettifyText</span>
    </div>

    <nav class="header-controls">
        <!-- Language selector -->
        <select id="lang-switcher" title="Language / Idioma">
            <option value="en">🇺🇸 EN</option>
            <option value="es">🇪🇸 ES</option>
        </select>

        <!-- Theme toggle -->
        <button id="theme-toggle" class="btn-icon" title="Toggle theme">🌙</button>

        <!-- About -->
        <button id="btn-about" class="btn-icon" data-i18n="about">About</button>
    </nav>
</header>

<!-- ===================== HERO ===================== -->
<section class="hero">
    <div class="hero-content">
        <h1>PrettifyText</h1>
        <p data-i18n="tagline">Format &amp; beautify any code instantly</p>
        <div class="format-badges">
            <span class="badge">JSON</span>
            <span class="badge">HTML</span>
            <span class="badge">XML</span>
            <span class="badge">CSS</span>
            <span class="badge">JavaScript</span>
            <span class="badge">TypeScript</span>
            <span class="badge">SQL</span>
            <span class="badge">YAML</span>
            <span class="badge">Markdown</span>
            <span class="badge">Base64</span>
            <span class="badge">URL</span>
        </div>
    </div>
</section>

<!-- ===================== EDITOR ===================== -->
<div class="editor-wrapper">

    <!-- Top toolbar: format selector + global status -->
    <div class="global-toolbar">
        <div class="toolbar-left">
            <label for="format-selector" style="font-size:.8rem;color:var(--text-muted)">Format:</label>
            <select id="format-selector">
                <option value="auto"        data-i18n="format_auto">🔍 Auto Detect</option>
                <optgroup label="Web">
                    <option value="json"       >JSON</option>
                    <option value="html"       >HTML</option>
                    <option value="xml"        >XML</option>
                    <option value="css"        >CSS</option>
                    <option value="javascript" >JavaScript</option>
                    <option value="typescript" >TypeScript</option>
                </optgroup>
                <optgroup label="Data">
                    <option value="sql"        >SQL</option>
                    <option value="yaml"       >YAML</option>
                    <option value="markdown"   >Markdown</option>
                </optgroup>
                <optgroup label="Encoding">
                    <option value="base64d"    >Base64 → Decode</option>
                    <option value="base64e"    >Base64 → Encode</option>
                    <option value="urld"       >URL → Decode</option>
                    <option value="urle"       >URL → Encode</option>
                </optgroup>
            </select>
        </div>

        <!-- Status bar (inline, grows to fill) -->
        <div id="status-bar" class="status-bar" role="status" aria-live="polite"></div>
    </div>

    <!-- Two-panel editor grid -->
    <div class="editor-grid">

        <!-- ---- INPUT PANEL ---- -->
        <div class="panel input-panel">
            <div class="panel-header">
                <span class="panel-title" data-i18n="input">Input</span>
            </div>
            <div class="panel-body">
                <div class="editor-area">
                    <!-- Line number gutter — synced to textarea scroll via JS -->
                    <div class="line-numbers" id="input-line-numbers" aria-hidden="true"><span>1</span></div>
                    <textarea
                        id="input-text"
                        spellcheck="false"
                        data-i18n-placeholder="placeholder"
                        placeholder="Paste your code here…  (Ctrl+Enter to format)"
                    ></textarea>
                </div>
            </div>
            <div class="panel-footer">
                <span id="input-stats">0 chars | 0 lines</span>
            </div>
        </div>

        <!-- ---- ACTIONS COLUMN ---- -->
        <div class="actions-column">
            <button id="btn-prettify" class="btn btn-primary"  data-i18n="prettify">▶ Prettify</button>
            <button id="btn-minify"   class="btn btn-secondary" data-i18n="minify">⊟ Minify</button>
            <button id="btn-swap"     class="btn btn-secondary" data-i18n="swap">⇄ Swap</button>
            <button id="btn-clear"    class="btn btn-secondary" data-i18n="clear">✕ Clear</button>
        </div>

        <!-- ---- OUTPUT PANEL ---- -->
        <div class="panel output-panel">
            <div class="panel-header">
                <span class="panel-title" data-i18n="output">Output</span>
                <div style="display:flex;gap:.5rem;align-items:center">
                    <span id="format-detected" class="format-badge"></span>
                    <button id="btn-copy" class="btn-icon" data-i18n="copy">Copy</button>
                </div>
            </div>
            <div class="panel-body">
                <div class="output-scroll">
                    <div class="editor-area">
                        <!-- Line number gutter for output — updated after each format -->
                        <div class="line-numbers" id="output-line-numbers" aria-hidden="true"><span>1</span></div>
                        <pre><code id="output-code" class="plaintext"></code></pre>
                    </div>
                </div>
            </div>
            <div class="panel-footer">
                <span id="output-stats">0 chars | 0 lines</span>
            </div>
        </div>

    </div><!-- /.editor-grid -->
</div><!-- /.editor-wrapper -->

<!-- ===================== ABOUT MODAL ===================== -->
<div id="about-modal" class="modal-overlay hidden" role="dialog" aria-modal="true">
    <div class="modal-card">
        <div class="modal-logo">✦</div>
        <div class="modal-title">PrettifyText</div>
        <div class="modal-version">v<?= htmlspecialchars($version) ?></div>
        <p class="modal-creator" data-i18n="created_by">Created by Synyster Rick</p>
        <p class="modal-rights"><?= $year ?> — <span data-i18n="rights">All Rights Reserved</span></p>
        <a href="https://www.paypal.com/donate/?hosted_button_id=ZABFRXC2P3JQN"
           target="_blank" rel="noopener" class="btn-beer" style="margin-bottom:1rem">
            🍺 <span data-i18n="buy_beer">Buy me a beer</span>
        </a>
        <br>
        <button id="close-modal" class="btn btn-secondary" data-i18n="close">Close</button>
    </div>
</div>

<!-- ===================== FOOTER ===================== -->
<footer class="app-footer">
    <a href="https://www.paypal.com/donate/?hosted_button_id=ZABFRXC2P3JQN"
       target="_blank" rel="noopener" class="btn-beer">
        🍺 <span data-i18n="buy_beer">Buy me a beer</span>
    </a>
    <span class="footer-info">
        PrettifyText v<?= htmlspecialchars($version) ?> &mdash;
        <span data-i18n="created_by">Created by Synyster Rick</span> &mdash;
        <?= $year ?> <span data-i18n="rights">All Rights Reserved</span>
    </span>
</footer>

<!-- ===================== VENDOR SCRIPTS (CDN) ===================== -->
<!-- Syntax highlighting -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
<!-- js-beautify: HTML / CSS / JS formatting -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.15.1/beautify.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.15.1/beautify-css.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.15.1/beautify-html.min.js"></script>
<!-- YAML parser/dumper -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.1.0/js-yaml.min.js"></script>
<!-- Markdown renderer -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/marked/9.1.6/marked.min.js"></script>
<!-- SQL formatter -->
<script src="https://cdn.jsdelivr.net/npm/sql-formatter@15.4.7/dist/sql-formatter.min.js"></script>

<!-- Embed PHP version so JS can read it -->
<script>window.APP_VERSION = '<?= htmlspecialchars($version) ?>';</script>

<!-- Application logic -->
<script src="frontend/js/app.js"></script>

</body>
</html>
