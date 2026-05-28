export function initVideoLoader() {
  const videos = [...document.querySelectorAll('video[preload="none"]')]
  if (!videos.length) return

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        const video = entry.target
        video.load()
        video.play().catch(() => {})
        observer.unobserve(video)
      })
    },
    { rootMargin: '300px' }
  )

  videos.forEach(v => observer.observe(v))
}
