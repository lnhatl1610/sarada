import { useState } from 'react'
import type { ImgHTMLAttributes } from 'react'
import './ResponsiveImage.css'

type ResponsiveImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> & {
  src?: string | null
  alt: string
  srcSet?: string
  mobileSrc?: string
  sizes?: string
  pictureClassName?: string
  width?: number
  height?: number
}

export function ResponsiveImage({ src, srcSet, mobileSrc, sizes, pictureClassName, alt, width = 800, height = 1000, loading = 'lazy', decoding = 'async', onError, ...props }: ResponsiveImageProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null)
  const failed = Boolean(src && failedSource === src)
  // Product demo srcsets are API-generated WebP paths with matching AVIF derivatives.
  // Other images keep their original format and naturally skip this source.
  const avifSrcSet = srcSet?.includes('/demo-media/products/') ? srcSet.replace(/\.webp(?=\s|,|$)/g, '.avif') : undefined

  const imageUnavailable = !src || failed
  const imageSources = <>
    {!imageUnavailable && mobileSrc && <source media="(max-width: 620px)" srcSet={mobileSrc} />}
    {!imageUnavailable && avifSrcSet && <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} />}
    {imageUnavailable
      ? <span className="responsive-image-placeholder" role="img" aria-label="Ảnh chưa có sẵn" />
      : <img
        {...props}
        src={src ?? undefined}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        decoding={decoding}
        onError={(event) => {
          onError?.(event)
          if (src) setFailedSource(src)
        }}
      />}
  </>

  return <picture className={pictureClassName ?? 'responsive-image-picture'}>{imageSources}</picture>
}
