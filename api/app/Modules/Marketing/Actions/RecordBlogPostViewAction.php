<?php

namespace App\Modules\Marketing\Actions;

use App\Models\BlogPost;
use Illuminate\Support\Facades\DB;

class RecordBlogPostViewAction
{
    public function execute(BlogPost $post): void
    {
        DB::table('blog_posts')->where('id', $post->id)->increment('view_count');
        $post->setAttribute('view_count', (int) $post->view_count + 1);
    }
}
