<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Role extends Model
{
    public const ADMIN_NAMES = ['super_admin', 'admin', 'sales_manager', 'warehouse_staff', 'customer_service', 'content_editor', 'accountant', 'staff'];

    public const ASSIGNABLE_ADMIN_NAMES = ['admin', 'staff', 'sales_manager', 'warehouse_staff', 'customer_service', 'content_editor', 'accountant'];

    public const DEFINITIONS = [
        'super_admin' => ['label' => 'Chủ cửa hàng', 'description' => 'Toàn quyền quản lý cửa hàng và tài khoản quản trị.'],
        'admin' => ['label' => 'Quản trị viên', 'description' => 'Quản lý toàn bộ hoạt động vận hành cửa hàng.'],
        'sales_manager' => ['label' => 'Quản lý bán hàng', 'description' => 'Quản lý đơn hàng, khách hàng, khuyến mãi và báo cáo.'],
        'warehouse_staff' => ['label' => 'Nhân viên kho', 'description' => 'Theo dõi sản phẩm, tồn kho và lịch sử điều chỉnh.'],
        'customer_service' => ['label' => 'Chăm sóc khách hàng', 'description' => 'Hỗ trợ khách hàng, xử lý đơn và kiểm duyệt đánh giá.'],
        'content_editor' => ['label' => 'Biên tập nội dung', 'description' => 'Quản lý nội dung cửa hàng và xem danh mục sản phẩm.'],
        'accountant' => ['label' => 'Kế toán', 'description' => 'Xem đơn hàng và báo cáo, không chỉnh sửa dữ liệu bán hàng.'],
        'staff' => ['label' => 'Nhân viên', 'description' => 'Vai trò tương thích dành cho tài khoản nhân viên cũ.'],
    ];

    protected $fillable = ['name', 'guard_name'];

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class);
    }

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class);
    }
}
