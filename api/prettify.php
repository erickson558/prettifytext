<?php
/* ============================================================
   PrettifyText — api/prettify.php
   Server-side formatting endpoint.
   Accepts POST JSON: { "text": "...", "format": "json|xml|..." }
   Returns JSON:      { "success": bool, "output": "...", "error": "..." }

   NOTE: Most formatting is done client-side (app.js).
   This endpoint is a fallback / server-authoritative path for
   formats where PHP gives better results (XML via DOMDocument).
   ============================================================ */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Pre-flight OPTIONS request (CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// ---- Parse input ----
$body   = file_get_contents('php://input');
$data   = json_decode($body, true);

// Validate that we received valid JSON in the request body
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid request body']);
    exit;
}

// Sanitise: only accept text string and format key
$text   = isset($data['text'])   ? (string) $data['text']   : '';
$format = isset($data['format']) ? (string) $data['format'] : 'json';

// Whitelist of allowed format keys
$allowed = ['json', 'xml', 'base64e', 'base64d', 'urle', 'urld'];
if (!in_array($format, $allowed, true)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Unsupported format']);
    exit;
}

$result = ['success' => false, 'output' => '', 'error' => ''];

switch ($format) {

    /* ---- JSON pretty-print via PHP ---- */
    case 'json':
        $decoded = json_decode($text);
        if (json_last_error() === JSON_ERROR_NONE) {
            $result['output']  = json_encode(
                $decoded,
                JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
            );
            $result['success'] = true;
        } else {
            $result['error'] = 'Invalid JSON: ' . json_last_error_msg();
        }
        break;

    /* ---- XML pretty-print via DOMDocument ---- */
    case 'xml':
        $dom = new DOMDocument('1.0', 'UTF-8');
        $dom->preserveWhiteSpace = false;
        $dom->formatOutput       = true;

        // Suppress libxml warnings so we can handle the error ourselves
        libxml_use_internal_errors(true);
        $loaded = $dom->loadXML($text);
        $errors = libxml_get_errors();
        libxml_clear_errors();

        if ($loaded) {
            $result['output']  = $dom->saveXML();
            $result['success'] = true;
        } else {
            $msg = !empty($errors) ? $errors[0]->message : 'Unknown XML error';
            $result['error'] = 'Invalid XML: ' . trim($msg);
        }
        break;

    /* ---- Base64 encode ---- */
    case 'base64e':
        $result['output']  = base64_encode($text);
        $result['success'] = true;
        break;

    /* ---- Base64 decode ---- */
    case 'base64d':
        // strict=true rejects characters outside the base64 alphabet
        $decoded = base64_decode($text, true);
        if ($decoded !== false) {
            $result['output']  = $decoded;
            $result['success'] = true;
        } else {
            $result['error'] = 'Invalid Base64 string';
        }
        break;

    /* ---- URL encode ---- */
    case 'urle':
        $result['output']  = rawurlencode($text);
        $result['success'] = true;
        break;

    /* ---- URL decode ---- */
    case 'urld':
        $result['output']  = rawurldecode($text);
        $result['success'] = true;
        break;
}

echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
