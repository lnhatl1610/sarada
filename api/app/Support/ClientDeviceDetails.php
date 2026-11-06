<?php

namespace App\Support;

final class ClientDeviceDetails
{
    /** @return array{browser: string, browser_version: ?string, operating_system: string, device_type: string} */
    public static function fromUserAgent(?string $userAgent): array
    {
        $agent = $userAgent ?? '';
        $browser = 'Trình duyệt khác';
        $browserVersion = null;

        foreach ([
            'Edge' => '/Edg(?:e|A|iOS)?\/([\d.]+)/i',
            'Opera' => '/(?:OPR|Opera)\/([\d.]+)/i',
            'Samsung Internet' => '/SamsungBrowser\/([\d.]+)/i',
            'Firefox' => '/(?:Firefox|FxiOS)\/([\d.]+)/i',
            'Chrome' => '/(?:Chrome|CriOS)\/([\d.]+)/i',
            'Safari' => '/Version\/([\d.]+).*Safari/i',
        ] as $name => $pattern) {
            if (preg_match($pattern, $agent, $matches) === 1) {
                $browser = $name;
                $browserVersion = $matches[1];
                break;
            }
        }

        $operatingSystem = match (true) {
            preg_match('/iPhone|iPod/i', $agent) === 1 => 'iOS',
            preg_match('/iPad/i', $agent) === 1 => 'iPadOS',
            preg_match('/Android/i', $agent) === 1 => 'Android',
            preg_match('/Windows NT 10/i', $agent) === 1 => 'Windows 10/11',
            preg_match('/Windows NT 6\.3/i', $agent) === 1 => 'Windows 8.1',
            preg_match('/Windows NT 6\.1/i', $agent) === 1 => 'Windows 7',
            preg_match('/Windows/i', $agent) === 1 => 'Windows',
            preg_match('/Mac OS X|Macintosh/i', $agent) === 1 => 'macOS',
            preg_match('/CrOS/i', $agent) === 1 => 'ChromeOS',
            preg_match('/Linux/i', $agent) === 1 => 'Linux',
            default => 'Không xác định',
        };

        $deviceType = match (true) {
            preg_match('/iPad|Tablet/i', $agent) === 1 => 'Máy tính bảng',
            preg_match('/Mobile|iPhone|iPod|Android/i', $agent) === 1 => 'Điện thoại',
            $agent !== '' => 'Máy tính',
            default => 'Không xác định',
        };

        return [
            'browser' => $browser,
            'browser_version' => $browserVersion,
            'operating_system' => $operatingSystem,
            'device_type' => $deviceType,
        ];
    }
}
