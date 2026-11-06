<?php

namespace App\Http\Controllers\Api\V1\Storefront;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use App\Models\Brand;
use App\Models\Collection;
use App\Models\Faq;
use App\Models\Page;
use App\Models\Product;
use App\Models\StoreLocation;
use App\Support\ActiveCategoryTree;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

class SitemapController extends Controller
{
    public function __invoke()
    {
        $storefrontUrl = rtrim((string) config('app.frontend_url'), '/');
        $cacheKey = 'storefront.sitemap.urls.v11.'.hash('sha256', $storefrontUrl);
        $urls = Cache::remember($cacheKey, now()->addMinutes(15), function () use ($storefrontUrl): array {
            $urls = [['loc' => $storefrontUrl.'/', 'lastmod' => null]];
            $urls[] = ['loc' => $storefrontUrl.'/sitemap', 'lastmod' => null];
            $urls[] = ['loc' => $storefrontUrl.'/style-guide', 'lastmod' => null];
            $brands = Brand::query()->whereHas('products', fn ($query) => $query->published())->orderBy('name')->orderBy('id')->get(['slug', 'updated_at']);
            if ($brands->isNotEmpty()) {
                $urls[] = ['loc' => $storefrontUrl.'/brands', 'lastmod' => $brands->max('updated_at')?->toAtomString()];
                foreach ($brands as $brand) {
                    $urls[] = ['loc' => $storefrontUrl.'/brands/'.$brand->slug, 'lastmod' => $brand->updated_at?->toAtomString()];
                }
            }
            $urls[] = ['loc' => $storefrontUrl.'/membership', 'lastmod' => null];
            $publishedPosts = BlogPost::query()->publiclyVisible()->orderBy('id')->get(['slug', 'updated_at']);
            $urls[] = ['loc' => $storefrontUrl.'/blog', 'lastmod' => $publishedPosts->max('updated_at')?->toAtomString()];
            foreach ($publishedPosts as $post) {
                $urls[] = ['loc' => $storefrontUrl.'/blog/'.$post->slug, 'lastmod' => $post->updated_at?->toAtomString()];
            }

            foreach (Product::query()->published()->orderBy('id')->get(['slug', 'updated_at']) as $product) {
                $urls[] = ['loc' => $storefrontUrl.'/products/'.$product->slug, 'lastmod' => $product->updated_at?->toAtomString()];
            }

            foreach (ActiveCategoryTree::flatten(ActiveCategoryTree::roots()) as $category) {
                $urls[] = [
                    'loc' => $storefrontUrl.'/categories/'.$category->slug,
                    'lastmod' => $category->updated_at?->toAtomString(),
                ];
            }

            $now = now();
            foreach (Collection::query()
                ->where('is_active', true)
                ->where(fn ($query) => $query->whereNull('starts_at')->orWhere('starts_at', '<=', $now))
                ->where(fn ($query) => $query->whereNull('ends_at')->orWhere('ends_at', '>', $now))
                ->orderBy('id')->get(['slug', 'updated_at', 'is_lookbook']) as $collection) {
                $urls[] = ['loc' => $storefrontUrl.'/collections/'.$collection->slug, 'lastmod' => $collection->updated_at?->toAtomString()];
                if ($collection->is_lookbook) {
                    $urls[] = ['loc' => $storefrontUrl.'/lookbook/'.$collection->slug, 'lastmod' => $collection->updated_at?->toAtomString()];
                }
            }

            foreach (Page::query()->where('is_published', true)->orderBy('id')->get(['slug', 'updated_at']) as $page) {
                $urls[] = ['loc' => $storefrontUrl.'/pages/'.$page->slug, 'lastmod' => $page->updated_at?->toAtomString()];
            }

            $lastStoreUpdate = StoreLocation::query()->where('is_active', true)->max('updated_at');
            if ($lastStoreUpdate !== null) {
                $urls[] = ['loc' => $storefrontUrl.'/stores', 'lastmod' => Carbon::parse($lastStoreUpdate)->toAtomString()];
            }

            $lastFaqUpdate = Faq::query()->where('is_active', true)->max('updated_at');
            if ($lastFaqUpdate !== null) {
                $urls[] = ['loc' => $storefrontUrl.'/faq', 'lastmod' => Carbon::parse($lastFaqUpdate)->toAtomString()];
            }

            return $urls;
        });

        $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n".'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
        foreach ($urls as $url) {
            $xml .= '<url><loc>'.htmlspecialchars($url['loc'], ENT_XML1 | ENT_COMPAT, 'UTF-8').'</loc>';
            if ($url['lastmod']) {
                $xml .= '<lastmod>'.htmlspecialchars($url['lastmod'], ENT_XML1 | ENT_COMPAT, 'UTF-8').'</lastmod>';
            }
            $xml .= '</url>';
        }
        $xml .= '</urlset>';

        return response($xml, 200, [
            'Content-Type' => 'application/xml; charset=UTF-8',
            'Cache-Control' => 'public, max-age=600',
        ]);
    }
}
