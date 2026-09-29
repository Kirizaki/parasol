<?php
/* ==========================================================================
   PARASOL — Brevo Subscription Endpoint
   Reads API key from .env (never hardcoded), adds contact to Brevo list.
   ========================================================================== */

// ---------- CORS & Headers ----------
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// Allow requests only from same origin (adjust if needed)
$allowed_origins = [
    'https://parasolsoundcartel.com',
    'https://www.parasolsoundcartel.com',
    'http://localhost',
    'http://127.0.0.1',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins, true)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ---------- Only POST ----------
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// ---------- Rate limiting (simple, file-based) ----------
$rate_limit_file = sys_get_temp_dir() . '/parasol_rate_' . md5($_SERVER['REMOTE_ADDR']);
$now = time();

if (file_exists($rate_limit_file)) {
    $last_request = (int) file_get_contents($rate_limit_file);
    if ($now - $last_request < 10) { // 10 second cooldown per IP
        http_response_code(429);
        echo json_encode(['error' => 'Too many attempts. Try again later.']);
        exit;
    }
}
file_put_contents($rate_limit_file, $now);

// ---------- Load .env ----------
$env_path = __DIR__ . '/.env';

if (!file_exists($env_path)) {
    error_log('PARASOL subscribe: .env file not found at ' . $env_path);
    http_response_code(500);
    echo json_encode(['error' => 'Server configuration error.']);
    exit;
}

$env_lines = file($env_path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
$env = [];
foreach ($env_lines as $line) {
    $line = trim($line);
    if ($line === '' || $line[0] === '#') continue;
    $parts = explode('=', $line, 2);
    if (count($parts) === 2) {
        $env[trim($parts[0])] = trim($parts[1]);
    }
}

$api_key = $env['BREVO_API_KEY'] ?? '';
$list_id = (int) ($env['BREVO_LIST_ID'] ?? 2);

if (empty($api_key)) {
    error_log('PARASOL subscribe: BREVO_API_KEY not set in .env');
    http_response_code(500);
    echo json_encode(['error' => 'Server configuration error.']);
    exit;
}

// ---------- Parse input ----------
$input = json_decode(file_get_contents('php://input'), true);
$email = isset($input['email']) ? trim(strtolower($input['email'])) : '';

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email address.']);
    exit;
}

// ---------- Call Brevo API ----------
$payload = json_encode([
    'email'            => $email,
    'listIds'          => [$list_id],
    'updateEnabled'    => true,  // don't error if contact already exists
]);

$ch = curl_init('https://api.brevo.com/v3/contacts');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 15,
    CURLOPT_HTTPHEADER     => [
        'accept: application/json',
        'content-type: application/json',
        'api-key: ' . $api_key,
    ],
]);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);
curl_close($ch);

// ---------- Handle response ----------
if ($curl_error) {
    error_log('PARASOL subscribe curl error: ' . $curl_error);
    http_response_code(502);
    echo json_encode(['error' => 'Could not connect to service. Try again.']);
    exit;
}

$brevo_response = json_decode($response, true);

// 201 = created, 204 = updated (updateEnabled)
if ($http_code === 201 || $http_code === 204) {
    echo json_encode(['success' => true, 'message' => 'Subscribed!']);
    exit;
}

// Contact already exists and is in the list — Brevo returns "duplicate_parameter"
if ($http_code === 400 && isset($brevo_response['code']) && $brevo_response['code'] === 'duplicate_parameter') {
    echo json_encode(['success' => true, 'message' => 'Already on the list!', 'duplicate' => true]);
    exit;
}

// Unexpected error
error_log('PARASOL subscribe Brevo error: HTTP ' . $http_code . ' — ' . $response);
http_response_code(502);
echo json_encode(['error' => 'An error occurred. Try again later.']);
