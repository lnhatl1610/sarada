<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use NotificationChannels\WebPush\HasPushSubscriptions;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

#[Fillable(['name', 'email', 'phone', 'avatar', 'gender', 'birthday', 'height_cm', 'weight_kg', 'bust_cm', 'waist_cm', 'hip_cm', 'status', 'last_login_at', 'job_title', 'department', 'bio', 'signature', 'timezone', 'password', 'created_by'])]
#[Hidden(['password', 'remember_token', 'last_login_ip', 'allowed_ips', 'two_factor_secret', 'two_factor_secret_pending', 'two_factor_recovery_codes'])]
class User extends Authenticatable implements JWTSubject
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasPushSubscriptions, MustVerifyEmail, Notifiable, SoftDeletes;

    public function isAdmin(): bool
    {
        return $this->roles()->whereIn('name', Role::ADMIN_NAMES)->exists();
    }

    public function pendingEmailChange(): HasOne
    {
        return $this->hasOne(PendingEmailChange::class);
    }

    public function pendingPhoneChange(): HasOne
    {
        return $this->hasOne(PendingPhoneChange::class);
    }

    public function getJWTIdentifier(): int|string
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [];
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(self::class, 'created_by');
    }

    public function hasAdminPermission(string $permission): bool
    {
        if ($this->relationLoaded('roles')) {
            if ($this->roles->contains('name', 'super_admin')) {
                return true;
            }
            if ($this->roles->contains(fn (Role $role): bool => $role->relationLoaded('permissions') && $role->permissions->contains('name', $permission))) {
                return true;
            }
        }

        return $this->roles()->where('name', 'super_admin')->exists()
            || $this->roles()->whereHas('permissions', fn ($query) => $query->where('permissions.guard_name', 'api')->where('permissions.name', $permission))->exists();
    }

    /** @return list<string> */
    public function adminPermissionNames(): array
    {
        if ($this->roles()->where('name', 'super_admin')->exists()) {
            return Permission::query()->where('guard_name', 'api')->orderBy('name')->pluck('name')->all();
        }

        return $this->roles()->with(['permissions' => fn ($query) => $query->where('permissions.guard_name', 'api')])->get()
            ->flatMap(fn (Role $role) => $role->permissions->pluck('name'))
            ->unique()->sort()->values()->all();
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(Address::class);
    }

    public function passkeys(): HasMany
    {
        return $this->hasMany(Passkey::class);
    }

    public function personalTasks(): HasMany
    {
        return $this->hasMany(UserTask::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function wishlistedProducts(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'wishlists')
            ->using(Wishlist::class)
            ->withPivot('created_at');
    }

    public function wishlistLists(): HasMany
    {
        return $this->hasMany(WishlistList::class);
    }

    public function recentlyViewedProducts(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'recently_viewed_products')
            ->withPivot('viewed_at')
            ->orderByPivot('viewed_at', 'desc');
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'birthday' => 'date',
            'height_cm' => 'decimal:1',
            'weight_kg' => 'decimal:1',
            'bust_cm' => 'decimal:1',
            'waist_cm' => 'decimal:1',
            'hip_cm' => 'decimal:1',
            'password' => 'hashed',
            'two_factor_secret' => 'encrypted',
            'two_factor_secret_pending' => 'encrypted',
            'two_factor_recovery_codes' => 'array',
            'two_factor_enabled_at' => 'datetime',
            'presence_until' => 'datetime',
            'last_seen_at' => 'datetime',
            'password_changed_at' => 'datetime',
            'must_change_password' => 'boolean',
            'allowed_ips' => 'array',
        ];
    }
}
