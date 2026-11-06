<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Review;
use App\Models\ReviewImage;
use App\Models\Role;
use App\Models\Shipment;
use App\Models\User;
use App\Modules\Orders\Actions\CreateManualOrderAction;
use App\Modules\Orders\Actions\CreateOrderChangeRequestAction;
use App\Modules\Orders\Actions\TransitionOrderAction;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class StorefrontOrderDemoSeeder extends Seeder
{
    private const IDEMPOTENCY_KEY = 'seed:storefront-customer-cod-order-v1';

    private const APPROVED_REVIEW_ORDER_KEY = 'seed:storefront-customer-approved-review-order-v1';

    private const ORDER_STATUS_PROGRESSION = [
        'pending' => 'confirmed',
        'confirmed' => 'processing',
        'processing' => 'shipping',
        'shipping' => 'delivered',
    ];

    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            return;
        }

        $actorId = User::query()->whereHas('roles', fn ($query) => $query->where('name', 'super_admin'))->orderBy('id')->value('id')
            ?? User::query()->orderBy('id')->value('id');

        if (! $actorId) {
            return;
        }

        $demoCustomerEmail = (string) config('store.demo_customer_email', 'demo.customer@example.test');
        $demoCustomerPassword = (string) config('store.demo_customer_password', '');
        if ($demoCustomerPassword === '' && app()->environment(['local', 'testing'])) {
            $demoCustomerPassword = 'StoreDemo123!';
        }

        $customer = User::query()->firstOrCreate(
            ['email' => $demoCustomerEmail],
            [
                'name' => 'Khách hàng demo',
                'phone' => '0900000002',
                'status' => 'active',
                'password' => Hash::make($demoCustomerPassword !== '' ? $demoCustomerPassword : Str::random(64)),
            ],
        );
        if ($customer->wasRecentlyCreated) {
            $customer->forceFill(['email_verified_at' => now()])->save();
        } elseif ($demoCustomerPassword !== '' && ! Hash::check($demoCustomerPassword, $customer->password)) {
            $customer->forceFill(['password' => Hash::make($demoCustomerPassword)])->save();
        }
        $customer->roles()->syncWithoutDetaching([
            Role::query()->firstOrCreate(['name' => 'customer', 'guard_name' => 'api'])->id,
        ]);

        $customer->addresses()->firstOrCreate(
            ['street' => '12 phố Đội Cấn'],
            [
                'recipient_name' => $customer->name,
                'phone' => '0900000002',
                'province_code' => '01',
                'district_code' => null,
                'ward_code' => '00004',
                'label' => 'home',
                'is_default' => true,
                'is_default_billing' => true,
            ],
        );

        $this->seedPendingCancellationOrder($customer, (int) $actorId);

        $wishlistedProduct = Product::query()->where('slug', 'vay-midi-co-vuong')->firstOrFail();
        $wishlistListId = DB::table('wishlist_lists')->where('user_id', $customer->id)->where('is_default', true)->value('id')
            ?? DB::table('wishlist_lists')->insertGetId([
                'user_id' => $customer->id,
                'name' => 'Yêu thích',
                'is_default' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        DB::table('wishlists')->insertOrIgnore([
            'user_id' => $customer->id,
            'wishlist_list_id' => $wishlistListId,
            'product_id' => $wishlistedProduct->id,
            'created_at' => now(),
        ]);

        $order = DB::table('orders')->where('idempotency_key', self::IDEMPOTENCY_KEY)->first();
        if (! $order) {
            $variant = ProductVariant::query()
                ->where('is_active', true)
                ->whereHas('product', fn ($query) => $query->where('slug', 'ao-so-mi-linen')->where('status', 'active'))
                ->firstOrFail();

            app(CreateManualOrderAction::class)->handle([
                'customer_id' => $customer->id,
                'customer_name' => $customer->name,
                'customer_email' => $customer->email,
                'customer_phone' => '0900000002',
                'shipping_address' => [
                    'recipient_name' => $customer->name,
                    'phone' => '0900000002',
                    'province_code' => '01',
                    'province_name' => 'Thành phố Hà Nội',
                    'district_code' => null,
                    'ward_code' => '00004',
                    'ward_name' => 'Phường Ba Đình',
                    'street' => '12 phố Đội Cấn',
                ],
                'items' => [['variant_id' => $variant->id, 'quantity' => 1]],
                'coupon_code' => 'NETWELCOME15',
                'note' => 'Đơn COD demo để kiểm tra luồng tài khoản và tra cứu.',
            ], (int) $actorId, self::IDEMPOTENCY_KEY);

            $order = DB::table('orders')->where('idempotency_key', self::IDEMPOTENCY_KEY)->firstOrFail();
        }

        if ($order->coupon_id !== null) {
            DB::table('coupon_usages')
                ->where('order_id', $order->id)
                ->where('coupon_id', $order->coupon_id)
                ->where('discount', '<>', $order->discount_total)
                ->update(['discount' => $order->discount_total, 'updated_at' => now()]);
        }

        $transition = app(TransitionOrderAction::class);
        while (! in_array($order->status, ['delivered', 'completed'], true)) {
            $next = self::ORDER_STATUS_PROGRESSION[$order->status] ?? null;
            if (! $next) {
                throw new \RuntimeException('The storefront demo order cannot reach a reviewable delivered state.');
            }

            $transition->handle(
                (int) $order->id,
                $next,
                $next === 'delivered' ? 'Đã giao và thu COD cho đơn demo.' : 'Cập nhật trạng thái đơn demo.',
                (int) $actorId,
                $next === 'delivered',
            );
            $order = DB::table('orders')->where('id', $order->id)->firstOrFail();
        }

        $order = $this->setDemoDeliveryTimestamp($order, CarbonImmutable::now()->subDay());

        Shipment::query()->firstOrCreate(
            ['order_id' => $order->id],
            [
                'carrier' => 'Viettel Post',
                'tracking_code' => 'DEMO-'.$order->code,
                'status' => 'delivered',
                'shipped_at' => $order->shipped_at ?? now()->subDay(),
                'delivered_at' => $order->delivered_at ?? now(),
            ],
        );

        DB::table('shipments')->where('order_id', $order->id)->update([
            'shipped_at' => $order->shipped_at,
            'delivered_at' => $order->delivered_at,
            'updated_at' => now(),
        ]);

        $item = DB::table('order_items')->where('order_id', $order->id)->firstOrFail();
        $pendingReview = Review::query()->firstOrCreate(
            ['order_item_id' => $item->id],
            [
                'product_id' => $item->product_id,
                'user_id' => $customer->id,
                'rating' => 5,
                'title' => 'Sản phẩm đúng mô tả',
                'content' => 'Đơn hàng demo đã giao; nội dung này dùng để kiểm tra quy trình duyệt đánh giá.',
                'fit' => 'true_to_size',
                'status' => 'pending',
            ],
        );

        if (app()->environment(['local', 'testing']) && $pendingReview->status === 'pending') {
            $demoReviewImagePath = 'reviews/demo-ai-review-photo.webp';
            $demoReviewImageSource = public_path('demo-media/products/ao-so-mi-linen-generated-v5-photo.webp');
            $publicDisk = Storage::disk('public');

            if (! $publicDisk->exists($demoReviewImagePath) && is_file($demoReviewImageSource)) {
                $imageContents = file_get_contents($demoReviewImageSource);
                if ($imageContents !== false) {
                    $publicDisk->put($demoReviewImagePath, $imageContents);
                }
            }

            if ($publicDisk->exists($demoReviewImagePath)) {
                ReviewImage::query()->firstOrCreate([
                    'review_id' => $pendingReview->id,
                    'url' => $publicDisk->url($demoReviewImagePath),
                ]);
            }
        }

        $hasReturnRequest = DB::table('order_change_requests')->where('order_id', $order->id)->where('type', 'return')->exists();
        if (! $hasReturnRequest) {
            app(CreateOrderChangeRequestAction::class)->handle(
                (string) $order->code,
                (int) $customer->id,
                'return',
                'Yêu cầu demo để kiểm tra quy trình tiếp nhận và duyệt trả hàng.',
            );
        }

        DB::table('order_change_requests')
            ->where('order_id', $order->id)
            ->where('type', 'return')
            ->where('status', 'pending')
            ->update(['created_at' => now(), 'updated_at' => now()]);

        $this->seedApprovedReview($customer, (int) $actorId, $transition);
    }

    private function seedPendingCancellationOrder(User $customer, int $actorId): void
    {
        $idempotencyKey = 'seed:storefront-customer-pending-cancellation-v1';
        $order = DB::table('orders')->where('idempotency_key', $idempotencyKey)->first();

        if (! $order) {
            $variant = ProductVariant::query()
                ->where('is_active', true)
                ->whereHas('product', fn ($query) => $query->where('slug', 'ao-polo-cotton-pique')->where('status', 'active'))
                ->whereHas('inventory', fn ($query) => $query->whereColumn('inventories.quantity', '>', 'inventories.reserved'))
                ->firstOrFail();

            app(CreateManualOrderAction::class)->handle([
                'customer_id' => $customer->id,
                'customer_name' => $customer->name,
                'customer_email' => $customer->email,
                'customer_phone' => '0900000002',
                'shipping_address' => [
                    'recipient_name' => $customer->name,
                    'phone' => '0900000002',
                    'province_code' => '01',
                    'province_name' => 'Thành phố Hà Nội',
                    'district_code' => null,
                    'ward_code' => '00004',
                    'ward_name' => 'Phường Ba Đình',
                    'street' => '12 phố Đội Cấn',
                ],
                'items' => [['variant_id' => $variant->id, 'quantity' => 1]],
                'note' => 'Đơn COD demo đang chờ để kiểm tra yêu cầu hủy.',
            ], $actorId, $idempotencyKey);

            $order = DB::table('orders')->where('idempotency_key', $idempotencyKey)->firstOrFail();
        }

        $hasPendingRequest = DB::table('order_change_requests')
            ->where('order_id', $order->id)
            ->where('status', 'pending')
            ->exists();

        if ($order->status === 'pending' && ! $hasPendingRequest) {
            app(CreateOrderChangeRequestAction::class)->handle(
                (string) $order->code,
                (int) $customer->id,
                'cancellation',
                'Yêu cầu demo để kiểm tra quy trình tiếp nhận và duyệt hủy đơn.',
            );
        }
    }

    private function seedApprovedReview(User $customer, int $actorId, TransitionOrderAction $transition): void
    {
        $product = Product::query()->where('slug', 'ao-thun-cotton-co-tron')->firstOrFail();
        $variant = ProductVariant::query()
            ->where('product_id', $product->id)
            ->where('is_active', true)
            ->firstOrFail();

        $shippingAddress = [
            'recipient_name' => $customer->name,
            'phone' => '0900000002',
            'province_code' => '01',
            'province_name' => 'Thành phố Hà Nội',
            'district_code' => null,
            'ward_code' => '00004',
            'ward_name' => 'Phường Ba Đình',
            'street' => '12 phố Đội Cấn',
        ];

        if (! DB::table('orders')->where('idempotency_key', self::APPROVED_REVIEW_ORDER_KEY)->exists()) {
            app(CreateManualOrderAction::class)->handle([
                'customer_id' => $customer->id,
                'customer_name' => $customer->name,
                'customer_email' => $customer->email,
                'customer_phone' => '0900000002',
                'shipping_address' => $shippingAddress,
                'items' => [['variant_id' => $variant->id, 'quantity' => 1]],
                'note' => 'Đơn COD demo đã giao để cung cấp đánh giá mẫu đã duyệt.',
            ], $actorId, self::APPROVED_REVIEW_ORDER_KEY);
        }

        $order = DB::table('orders')->where('idempotency_key', self::APPROVED_REVIEW_ORDER_KEY)->firstOrFail();
        while (! in_array($order->status, ['delivered', 'completed'], true)) {
            $next = self::ORDER_STATUS_PROGRESSION[$order->status] ?? null;
            if (! $next) {
                throw new \RuntimeException('The approved-review demo order cannot reach a delivered state.');
            }

            $transition->handle(
                (int) $order->id,
                $next,
                $next === 'delivered' ? 'Đã giao và thu COD cho đơn đánh giá demo.' : 'Cập nhật trạng thái đơn đánh giá demo.',
                $actorId,
                $next === 'delivered',
            );
            $order = DB::table('orders')->where('id', $order->id)->firstOrFail();
        }

        // Keep this known demo order past the customer return window to demonstrate the expired account state.
        $order = $this->setDemoDeliveryTimestamp($order, CarbonImmutable::now()->subDays(14));

        Shipment::query()->firstOrCreate(
            ['order_id' => $order->id],
            [
                'carrier' => 'Viettel Post',
                'tracking_code' => 'DEMO-'.$order->code,
                'status' => 'delivered',
                'shipped_at' => $order->shipped_at ?? now()->subDay(),
                'delivered_at' => $order->delivered_at ?? now(),
            ],
        );
        DB::table('shipments')->where('order_id', $order->id)->update([
            'shipped_at' => $order->shipped_at,
            'delivered_at' => $order->delivered_at,
            'updated_at' => now(),
        ]);
        $item = DB::table('order_items')->where('order_id', $order->id)->where('product_id', $product->id)->firstOrFail();
        Review::query()->firstOrCreate(
            ['order_item_id' => $item->id],
            [
                'product_id' => $product->id,
                'user_id' => $customer->id,
                'rating' => 5,
                'title' => 'Mẫu đánh giá đã được duyệt',
                'content' => 'Đánh giá demo gắn với đơn hàng COD đã giao, dùng để hiển thị trạng thái mua hàng đã xác minh.',
                'fit' => 'true_to_size',
                'status' => 'approved',
            ],
        );

        $ratingSummary = Review::query()->where('product_id', $product->id)->where('status', 'approved')
            ->selectRaw('COUNT(*) as review_count, COALESCE(AVG(rating), 0) as review_average')
            ->first();
        $product->forceFill([
            'rating_count' => (int) $ratingSummary->review_count,
            'rating_avg' => $ratingSummary->review_average,
        ])->save();
    }

    private function setDemoDeliveryTimestamp(object $order, CarbonImmutable $deliveredAt): object
    {
        $history = DB::table('order_status_histories')
            ->where('order_id', $order->id)
            ->orderBy('id')
            ->get(['id', 'to_status']);
        $preDeliveryEvents = $history->filter(fn (object $event): bool => ! in_array($event->to_status, ['delivered', 'completed'], true));
        $placedAt = $deliveredAt->subHours(max(1, $preDeliveryEvents->count()));
        $confirmedAt = null;
        $shippedAt = null;
        $preDeliveryIndex = 0;

        foreach ($history as $event) {
            if ($event->to_status === 'delivered') {
                $eventAt = $deliveredAt;
            } elseif ($event->to_status === 'completed') {
                $eventAt = $deliveredAt->addDay();
            } else {
                $eventAt = $placedAt->addHours($preDeliveryIndex++);
            }

            DB::table('order_status_histories')->where('id', $event->id)->update([
                'created_at' => $eventAt,
                'updated_at' => $eventAt,
            ]);

            if ($event->to_status === 'confirmed') {
                $confirmedAt = $eventAt;
            } elseif ($event->to_status === 'shipping') {
                $shippedAt = $eventAt;
            }
        }

        DB::table('orders')->where('id', $order->id)->update([
            'placed_at' => $placedAt,
            'confirmed_at' => $confirmedAt,
            'shipped_at' => $shippedAt ?? $deliveredAt->subHour(),
            'delivered_at' => $deliveredAt,
            'updated_at' => now(),
        ]);

        return DB::table('orders')->where('id', $order->id)->firstOrFail();
    }
}
