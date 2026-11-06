<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'code', 'idempotency_key', 'idempotency_scope', 'user_id', 'customer_name', 'customer_email', 'customer_phone',
        'shipping_address', 'fulfillment_type', 'pickup_location_id', 'pickup_location_snapshot', 'subtotal', 'discount_total', 'membership_points_used', 'membership_discount_total', 'shipping_fee', 'grand_total',
        'coupon_id', 'coupon_code', 'shipping_method_id', 'status', 'payment_status',
        'payment_method', 'note', 'placed_at', 'confirmed_at', 'shipped_at', 'delivered_at',
        'cancelled_at', 'cancel_reason',
        'invoice_requested', 'invoice_tax_code', 'invoice_company_name', 'invoice_address',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'integer',
            'discount_total' => 'integer',
            'membership_points_used' => 'integer',
            'membership_discount_total' => 'integer',
            'shipping_fee' => 'integer',
            'grand_total' => 'integer',
            'placed_at' => 'datetime',
            'confirmed_at' => 'datetime',
            'shipped_at' => 'datetime',
            'delivered_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'invoice_requested' => 'boolean',
            'pickup_location_id' => 'integer',
            'pickup_location_snapshot' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function coupon(): BelongsTo
    {
        return $this->belongsTo(Coupon::class);
    }

    public function shippingMethod(): BelongsTo
    {
        return $this->belongsTo(ShippingMethod::class);
    }

    public function pickupLocation(): BelongsTo
    {
        return $this->belongsTo(StoreLocation::class, 'pickup_location_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function statusHistories(): HasMany
    {
        return $this->hasMany(OrderStatusHistory::class)->orderBy('created_at');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function shipments(): HasMany
    {
        return $this->hasMany(Shipment::class);
    }
}
