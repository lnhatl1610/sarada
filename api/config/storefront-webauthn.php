<?php

return [
    'rp_id' => env('STORE_WEBAUTHN_RP_ID', parse_url((string) env('APP_URL', 'http://localhost'), PHP_URL_HOST) ?: 'localhost'),
    'allowed_origins' => array_values(array_filter(array_map(
        static fn (string $origin): string => rtrim(trim($origin), '/'),
        explode(',', (string) env('STORE_WEBAUTHN_ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173')),
    ))),
    'challenge_ttl_seconds' => 300,
];
