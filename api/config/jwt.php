<?php

return [
    'secret' => env('JWT_SECRET'),
    'ttl' => (int) env('JWT_TTL', 15),
    'algo' => env('JWT_ALGO', 'HS256'),
    'blacklist_enabled' => false,
];
