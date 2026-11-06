<?php

$trustedProxies = array_values(array_filter(array_map(
    'trim',
    explode(',', (string) env('TRUSTED_PROXIES', '')),
)));

return [
    // Laravel's global TrustProxies middleware reads this key. Keep the list empty
    // for direct client connections; otherwise trust only exact proxy IPs/CIDRs.
    'proxies' => $trustedProxies !== [] ? $trustedProxies : null,
];
