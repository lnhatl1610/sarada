<?php

return [
    // Public customer registration is convenient in local/UAT environments;
    // production remains closed unless explicitly enabled by the owner.
    'public_registration_enabled' => filter_var(
        env('STORE_PUBLIC_REGISTRATION_ENABLED', in_array(strtolower((string) env('APP_ENV', 'production')), ['local', 'testing', 'uat'], true)),
        FILTER_VALIDATE_BOOLEAN,
    ),
    'default_shipping_fee' => (int) env('STORE_DEFAULT_SHIPPING_FEE', 30000),
    'free_shipping_threshold' => (int) env('STORE_FREE_SHIPPING_THRESHOLD', 1500000),
    'uploads_per_minute' => (int) env('API_UPLOADS_PER_MINUTE', 20),
    'public_requests_per_minute' => (int) env('API_PUBLIC_REQUESTS_PER_MINUTE', 60),
    'admin_seed_email' => env('ADMIN_SEED_EMAIL'),
    'admin_seed_password' => env('ADMIN_SEED_PASSWORD'),
    'demo_customer_email' => env('STORE_DEMO_CUSTOMER_EMAIL', 'demo.customer@example.test'),
    'demo_customer_password' => env('STORE_DEMO_CUSTOMER_PASSWORD'),
    'demo_staff_email' => env('STORE_DEMO_STAFF_EMAIL', 'demo.staff@example.test'),
    'demo_staff_password' => env('STORE_DEMO_STAFF_PASSWORD'),
];
