<?php

namespace App\Support;

use RuntimeException;

class VietnamAddressCatalog
{
    private static ?array $sharedCatalog = null;

    private ?array $catalog = null;

    public function provinces(): array
    {
        return array_map(fn (array $province): array => [
            'code' => $province['code'],
            'name' => trim($province['name']),
        ], $this->catalog()['provinces'] ?? []);
    }

    public function wards(string $provinceCode): ?array
    {
        foreach ($this->catalog()['provinces'] ?? [] as $province) {
            if ($province['code'] !== $provinceCode) {
                continue;
            }

            return array_map(fn (array $ward): array => [
                'code' => $ward['code'],
                'name' => trim($ward['name']),
            ], $province['wards'] ?? []);
        }

        return null;
    }

    public function province(string $code): ?array
    {
        foreach ($this->catalog()['provinces'] ?? [] as $province) {
            if ($province['code'] === $code) {
                return ['code' => $province['code'], 'name' => trim($province['name'])];
            }
        }

        return null;
    }

    public function ward(string $provinceCode, string $wardCode): ?array
    {
        foreach ($this->catalog()['provinces'] ?? [] as $province) {
            if ($province['code'] !== $provinceCode) {
                continue;
            }

            foreach ($province['wards'] ?? [] as $ward) {
                if ($ward['code'] === $wardCode) {
                    return ['code' => $ward['code'], 'name' => trim($ward['name'])];
                }
            }

            return null;
        }

        return null;
    }

    public function metadata(): array
    {
        $catalog = $this->catalog();

        return ['source' => $catalog['source'] ?? null, 'as_of' => $catalog['asOf'] ?? null];
    }

    private function catalog(): array
    {
        if ($this->catalog !== null) {
            return $this->catalog;
        }

        if (self::$sharedCatalog !== null) {
            return $this->catalog = self::$sharedCatalog;
        }

        $path = base_path('../shared/data/vietnam-addresses.json');
        $contents = @file_get_contents($path);
        $catalog = $contents === false ? null : json_decode($contents, true);

        if (! is_array($catalog) || ! isset($catalog['provinces']) || ! is_array($catalog['provinces'])) {
            throw new RuntimeException('Vietnam address catalog is missing or invalid.');
        }

        self::$sharedCatalog = $catalog;

        return $this->catalog = $catalog;
    }
}
