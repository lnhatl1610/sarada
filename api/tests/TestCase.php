<?php

namespace Tests;

use App\Models\User;
use App\Modules\Identity\Actions\IssueAccessTokenAction;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Sanctum\NewAccessToken;

abstract class TestCase extends BaseTestCase
{
    protected function createApiToken(User $user, string $audience, string $name = 'test'): NewAccessToken
    {
        return app(IssueAccessTokenAction::class)->execute($user, $audience, $name);
    }
}
