#!/usr/bin/env python3
"""Convert the approved local AI demo product photos into storefront WebP assets.

Usage:
  python tools/assets/prepare-ai-demo-product-photos.py --source-dir <imagegen-output-dir>

The source PNGs stay outside the repository. The output includes a 1200x1600
detail image plus 200x267 thumbnail and 600x800 catalog candidates. Each output
is kept under the image budget in the website layout plan.
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
from pathlib import Path


SOURCES = {
    "ao-so-mi-linen-v2": "exec-5fc2efad-0f75-419a-8aa3-eaac6bd6e579.png",
    "quan-suong-cotton-v2": "exec-1fd2272f-c975-4dd9-9c32-ef6d2b7d4643.png",
    "vay-midi-co-vuong-v2": "exec-d305e65a-c8c9-430e-8a0e-d56c34aa37f4.png",
    "ao-so-mi-linen": "exec-ba57f100-6b58-4bee-b613-d4a3b30eed04.png",
    "quan-suong-cotton": "exec-9889d6e4-570f-4145-8133-377b435c70df.png",
    "vay-midi-co-vuong": "exec-ee5278c0-970a-4e32-b8d3-c43284458061.png",
    "ao-khoac-blazer": "exec-19d8f468-16f5-4605-8e33-5d53d6659775.png",
    "ao-thun-cotton-co-tron": "exec-89744153-0c0f-4da1-8eb0-68a3400cea64.png",
    "ao-kieu-tay-phong": "exec-58076ce2-0ec9-459d-ad0a-0060fd2daaab.png",
    "quan-ong-dung-linen": "exec-a620c611-7874-4e46-9474-4dd843b9fdf2.png",
    "chan-vay-chu-a-midi": "exec-061f5985-406b-4c28-ae82-2d6685e589fb.png",
    "ao-cardigan-det-kim": "exec-fa5610d2-9113-4240-b622-436be24b60e7.png",
    "tui-tote-canvas": "exec-b9b16348-1948-4343-8f0e-e768454126f7.png",
    "ao-polo-cotton-pique": "exec-4236a585-9fb9-4683-82b0-964a380c0de6.png",
    "ao-gile-linen": "exec-ff6a9d86-ba65-473e-bb64-e1a4000e5842.png",
    "ao-gile-linen-v2": "exec-5a6e7e08-09af-43d7-82d2-b0e6856c016f.png",
    "quan-short-linen": "exec-041fc991-bde1-47ff-8d81-526f20da7a27.png",
    "vay-quan-midi": "exec-a55e535e-7b51-4ad5-a713-1c3d399f97c5.png",
    "vay-so-mi-linen": "exec-38ad4f8a-e36e-4794-a965-6cf9b2b943b0.png",
    "khan-lua-vuong": "exec-abefcab6-cb0a-4b13-a12d-853eca223c19.png",
    "vi-mini-da-mem": "exec-e6e476cc-9f87-4dd9-85a8-8eef39267ec2.png",
    "ao-khoac-trench-ngan": "exec-83e4805b-b8a6-4727-bb61-5c388a91e34e.png",
    "ao-khoac-denim-ngan": "exec-ca83079a-d07f-4078-97ed-148944d806c9.png",
    # Photorealistic garment-only set requested for the 2026-10-27 demo refresh.
    # Versioned slugs preserve the previous WebP assets for comparison/rollback.
    "ao-so-mi-linen-v3": "exec-dc31a11c-8f3a-4ccf-b892-a33b1a8b0efd.png",
    "quan-suong-cotton-v3": "exec-a339d68f-1704-4d2c-b87e-dbf21b16b260.png",
    "vay-midi-co-vuong-v3": "exec-e78c25f8-aa3f-4629-8a39-4868372af23a.png",
    "ao-khoac-blazer-v3": "exec-ea343cd8-5250-4222-9e0d-e6a97920a52b.png",
    "ao-thun-cotton-co-tron-v3": "exec-cebbc7a4-36ac-4cd0-a359-400986ce834f.png",
    "ao-kieu-tay-phong-v3": "exec-721b418f-46c9-4188-b2b7-a01aa8b50c8e.png",
    "quan-ong-dung-linen-v3": "exec-d90d7ca1-46c9-4b8a-87a1-0cbca71f7020.png",
    "chan-vay-chu-a-midi-v3": "exec-13fe10b8-ece4-46c4-82a7-93ba72e7e7eb.png",
    "ao-cardigan-det-kim-v3": "exec-4ad074ad-adde-4813-9593-3aedcc38a040.png",
    "ao-polo-cotton-pique-v3": "exec-94c74bf9-2cfb-4547-bbe1-58b615396931.png",
    "ao-gile-linen-v3": "exec-7f47367e-7f0b-4796-acc8-47fe20e79348.png",
    "quan-short-linen-v3": "exec-9a41ad61-2008-4a2c-8392-684e5db48a7f.png",
    "vay-quan-midi-v3": "exec-17f7ce2c-4eaa-41ba-bc0e-508341627ea5.png",
    "vay-so-mi-linen-v3": "exec-a17c7437-3397-475a-b7a3-e3311dab5f77.png",
    "ao-khoac-trench-ngan-v3": "exec-fde0d5ad-15d3-45c0-b8ae-e71c36188c2d.png",
    "ao-khoac-denim-ngan-v3": "exec-43e17093-8452-4604-b4c4-99a2e9501138.png",
    # Scaled-garment catalog set edited from the active generated-v4 photos.
    "ao-so-mi-linen-generated-v5": "exec-aae21251-b119-4da3-aedb-a3bfc778bd34.png",
    "quan-suong-cotton-generated-v5": "exec-97ad2835-be5a-4d8f-b2e2-631996817198.png",
    "vay-midi-co-vuong-generated-v5": "exec-02f69f94-a0fb-42d6-9321-041fd6a90642.png",
    "ao-khoac-blazer-generated-v5": "exec-51dd1994-10aa-442a-8948-1c04c4aea177.png",
    "ao-cardigan-det-kim-generated-v5": "exec-cfcd5ab1-a1b2-47b3-b002-7b3ca2c72b2e.png",
    "ao-gile-linen-generated-v5": "exec-cf6c00de-a750-426e-8f93-c6bd021f9562.png",
    "ao-khoac-denim-ngan-generated-v5": "exec-59030a72-0e15-4318-ad08-a5c14b32078b.png",
    "ao-khoac-trench-ngan-generated-v5": "exec-7af8435b-2b47-4c90-8aa9-2a8c47b17905.png",
    "ao-kieu-tay-phong-generated-v5": "exec-d2ac0c4a-39a8-41f9-aa00-f925def6af6f.png",
    "ao-polo-cotton-pique-generated-v5": "exec-f201b5cb-d42c-46bd-83d2-c83824c07ba5.png",
    "ao-thun-cotton-co-tron-generated-v5": "exec-7a8176e5-d667-4926-8f6a-076e98a858c0.png",
    "chan-vay-chu-a-midi-generated-v5": "exec-616f1931-c0d6-49f0-90ff-173b32c9e038.png",
    "quan-ong-dung-linen-generated-v5": "exec-0932efe7-9754-47ec-961f-4efa3e619eb8.png",
    "quan-short-linen-generated-v5": "exec-8b08600d-7b61-4b91-94e4-5e1ceee03b67.png",
    "vay-quan-midi-generated-v5": "exec-079f8edf-317a-46f3-bf33-c80600416982.png",
    "vay-so-mi-linen-generated-v5": "exec-f8e4f878-b744-402e-a462-76cb773b4a0c.png",
}


def convert(ffmpeg: str, source: Path, destination: Path, width: int, max_bytes: int) -> int:
    height = (width * 4 + 2) // 3
    quality = 80
    while quality >= 35:
        subprocess.run(
            [
                ffmpeg,
                "-hide_banner",
                "-loglevel",
                "error",
                "-y",
                "-i",
                str(source),
                "-vf",
                f"scale={width}:{height}:force_original_aspect_ratio=increase,crop={width}:{height}",
                "-frames:v",
                "1",
                "-c:v",
                "libwebp",
                "-q:v",
                str(quality),
                "-compression_level",
                "6",
                str(destination),
            ],
            check=True,
        )
        if destination.stat().st_size <= max_bytes:
            return quality
        quality -= 5

    destination.unlink(missing_ok=True)
    raise RuntimeError(f"Unable to keep {destination} under {max_bytes} bytes")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", required=True, type=Path)
    parser.add_argument("--output-dir", type=Path, default=Path("api/public/demo-media/products"))
    parser.add_argument("--ffmpeg", default=shutil.which("ffmpeg") or "ffmpeg")
    parser.add_argument(
        "--only",
        action="append",
        choices=sorted(SOURCES),
        help="Convert one product image set; repeat to convert multiple sets.",
    )
    args = parser.parse_args()

    sources = {slug: SOURCES[slug] for slug in args.only} if args.only else {
        slug: source for slug, source in SOURCES.items() if slug.endswith("-generated-v5")
    }
    missing = [name for name in sources.values() if not (args.source_dir / name).is_file()]
    if missing:
        parser.error("Missing source PNGs: " + ", ".join(missing))

    args.output_dir.mkdir(parents=True, exist_ok=True)
    for slug, source_name in sources.items():
        source = args.source_dir / source_name
        destination = args.output_dir / f"{slug}-photo.webp"
        quality = convert(args.ffmpeg, source, destination, 600, 80_000)
        print(f"{destination}: {destination.stat().st_size} bytes (600×800 WebP q{quality})")


if __name__ == "__main__":
    main()
