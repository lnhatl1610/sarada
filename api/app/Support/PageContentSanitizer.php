<?php

namespace App\Support;

use DOMDocument;
use DOMElement;
use DOMNode;
use DOMXPath;

final class PageContentSanitizer
{
    /** @var list<string> */
    private const ALLOWED_TAGS = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'pre', 'code', 'hr'];

    /** @var list<string> */
    private const DROP_CONTENT_TAGS = ['script', 'style', 'iframe', 'object', 'embed', 'svg', 'math', 'template'];

    public static function sanitize(string $html): string
    {
        $document = new DOMDocument('1.0', 'UTF-8');
        $previous = libxml_use_internal_errors(true);

        try {
            $document->loadHTML('<?xml encoding="UTF-8"><div id="page-content-root">'.$html.'</div>', LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previous);
        }

        $root = (new DOMXPath($document))->query('//*[@id="page-content-root"]')?->item(0);
        if (! $root) {
            return '';
        }

        self::sanitizeChildren($root);

        $output = '';
        foreach ($root->childNodes as $child) {
            $output .= $document->saveHTML($child);
        }

        return trim($output);
    }

    private static function sanitizeChildren(DOMNode $parent): void
    {
        foreach (iterator_to_array($parent->childNodes) as $child) {
            if (! $child instanceof DOMElement) {
                continue;
            }

            $tag = strtolower($child->tagName);
            if (in_array($tag, self::DROP_CONTENT_TAGS, true)) {
                $parent->removeChild($child);

                continue;
            }

            self::sanitizeChildren($child);

            if (in_array($tag, self::ALLOWED_TAGS, true)) {
                while ($child->attributes->length > 0) {
                    $child->removeAttributeNode($child->attributes->item(0));
                }

                continue;
            }

            while ($child->firstChild) {
                $parent->insertBefore($child->firstChild, $child);
            }
            $parent->removeChild($child);
        }
    }
}
