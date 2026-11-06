<?php

namespace App\Http\Resources;

use App\Support\VietnamAddressCatalog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AddressResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $catalog = app(VietnamAddressCatalog::class);
        $province = $catalog->province((string) $this->province_code);
        $ward = $catalog->ward((string) $this->province_code, (string) $this->ward_code);

        return [
            'id' => $this->id,
            'recipient_name' => $this->recipient_name,
            'phone' => $this->phone,
            'province_code' => $this->province_code,
            'province_name' => $province['name'] ?? null,
            'district_code' => $this->district_code,
            'ward_code' => $this->ward_code,
            'ward_name' => $ward['name'] ?? null,
            'street' => $this->street,
            'label' => $this->label,
            'is_default' => $this->is_default,
            'is_default_billing' => $this->is_default_billing,
        ];
    }
}
