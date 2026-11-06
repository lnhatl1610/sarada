<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PageResource;
use App\Http\Resources\StorefrontPublicPageLinkResource;
use App\Models\Page;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PageController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return StorefrontPublicPageLinkResource::collection(
            Page::query()
                ->where('is_published', true)
                ->select(['id', 'title', 'slug', 'is_published'])
                ->orderBy('title')
                ->orderBy('id')
                ->limit(100)
                ->get()
        );
    }

    public function show(string $slug): PageResource
    {
        return new PageResource(Page::query()->where('slug', $slug)->where('is_published', true)->firstOrFail());
    }
}
