import { lazy, Suspense } from 'react'

const ReactPlayer = lazy(async () => {
  const [{ createReactPlayer }, { default: HtmlPlayer }, { canPlay }] = await Promise.all([
    import('react-player/ReactPlayer'),
    import('react-player/HtmlPlayer'),
    import('react-player/patterns'),
  ])
  const filePlayer = { key: 'html', name: 'HTML media', canPlay: canPlay.html, canEnablePIP: () => true, player: HtmlPlayer }

  return { default: createReactPlayer([filePlayer], filePlayer) }
})

export function StorefrontVideoPlayer({ src, label }: { src: string; label: string }) {
  return <Suspense fallback={<p role="status">Đang tải trình phát video…</p>}>
    <ReactPlayer
      src={src}
      controls
      playsInline
      preload="metadata"
      aria-label={label}
      width="100%"
      height="auto"
      style={{ aspectRatio: '16 / 9', maxHeight: 720, background: '#111' }}
    />
  </Suspense>
}
