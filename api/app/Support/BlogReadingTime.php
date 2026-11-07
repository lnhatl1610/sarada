<?php

namespace App\Support;

class BlogReadingTime
{
    public static function estimate(string $html): int
    {
        $text = html_entity_decode(strip_tags(PageContentSanitizer::sanitize($html)), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $words = preg_split('/\s+/u', trim($text), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        return max(1, (int) ceil(count($words) / 200));
    }
}
