<?php

namespace App\Support;

final class StorefrontHomeSections
{
    public const KEYS = [
        'hero',
        'categories',
        'new_arrivals',
        'campaign',
        'best_sellers',
        'recently_viewed',
        'personalized',
        'collections',
        'service_strip',
        'lookbook',
        'newsletter',
        'membership',
        'instagram',
    ];

    public static function defaults(): array
    {
        return array_map(static fn (string $key): array => ['key' => $key, 'enabled' => true], self::KEYS);
    }

    public static function normalize(mixed $value): array
    {
        if (is_string($value)) {
            $value = json_decode($value, true);
        }

        if (! is_array($value) || ! array_is_list($value)) {
            return self::defaults();
        }

        $sections = [];
        foreach ($value as $section) {
            if (! is_array($section)
                || ! isset($section['key'])
                || ! in_array($section['key'], self::KEYS, true)
                || ! array_key_exists('enabled', $section)
                || ! is_bool($section['enabled'])
                || isset($sections[$section['key']])) {
                return self::defaults();
            }

            $sections[$section['key']] = ['key' => $section['key'], 'enabled' => $section['enabled']];
        }

        foreach (self::KEYS as $key) {
            if (! isset($sections[$key])) {
                $sections[$key] = ['key' => $key, 'enabled' => true];
            }
        }

        $normalized = array_values($sections);

        return collect($normalized)->contains(fn (array $section): bool => $section['enabled']) ? $normalized : self::defaults();
    }
}
