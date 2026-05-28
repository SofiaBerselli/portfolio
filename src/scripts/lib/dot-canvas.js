const GRID         = 32
const R            = 1.2
const DOT_COLOR    = 'rgba(180,175,168,0.65)'
const REPEL_RADIUS = 180
const MAX_PUSH     = 7
const SPRING       = 0.025
const DAMP         = 0.76
const SETTLE       = 0.001

export function initDotCanvas() {
  const postHome = document.querySelector('.post-home')
  if (!postHome) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const canvas = document.createElement('canvas')
  Object.assign(canvas.style, {
    position: 'fixed', inset: '0',
    width: '100vw', height: '100vh',
    pointerEvents: 'none', zIndex: '0',
  })
  document.body.insertAdjacentElement('afterbegin', canvas)
  const ctx = canvas.getContext('2d')

  let W = canvas.width  = window.innerWidth
  let H = canvas.height = window.innerHeight

  let phLeft = postHome.offsetLeft
  let phTop  = postHome.offsetTop

  window.addEventListener('resize', () => {
    W = canvas.width  = window.innerWidth
    H = canvas.height = window.innerHeight
    phLeft = postHome.offsetLeft
    phTop  = postHome.offsetTop
  })

  const mouse = { x: -9999, y: -9999 }
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY })
  window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999 })

  const state = new Map()

  function tick() {
    const rect = postHome.getBoundingClientRect()

    if (rect.bottom < 0 || rect.top > H) {
      requestAnimationFrame(tick)
      return
    }

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = DOT_COLOR

    const sy   = window.scrollY
    const sx   = window.scrollX
    const jMin = Math.floor((sx - phLeft) / GRID)
    const jMax = Math.ceil((sx + W - phLeft) / GRID)
    const iMin = Math.max(0, Math.floor((sy - phTop) / GRID))
    const iMax = Math.ceil((sy + H - phTop) / GRID)

    for (let i = iMin; i <= iMax; i++) {
      for (let j = jMin; j <= jMax; j++) {
        const bx  = phLeft + j * GRID - sx
        const by  = phTop  + i * GRID - sy
        const key = `${j},${i}`
        let s     = state.get(key)

        const dx   = s ? s.dx : 0
        const dy   = s ? s.dy : 0
        const cx   = bx + dx
        const cy   = by + dy
        const dist = Math.hypot(mouse.x - cx, mouse.y - cy)

        if (dist < REPEL_RADIUS || s) {
          if (!s) { s = { dx: 0, dy: 0, vx: 0, vy: 0 }; state.set(key, s) }

          if (dist < REPEL_RADIUS && dist > 0) {
            const nx    = (cx - mouse.x) / dist
            const ny    = (cy - mouse.y) / dist
            const force = (1 - dist / REPEL_RADIUS) * MAX_PUSH * 0.18
            s.vx += nx * force
            s.vy += ny * force
          }

          s.vx += -s.dx * SPRING
          s.vy += -s.dy * SPRING
          s.vx *= DAMP
          s.vy *= DAMP
          s.dx += s.vx
          s.dy += s.vy

          if (Math.abs(s.dx) < SETTLE && Math.abs(s.dy) < SETTLE &&
              Math.abs(s.vx) < SETTLE && Math.abs(s.vy) < SETTLE) {
            state.delete(key)
            s = null
          }
        }

        ctx.beginPath()
        ctx.arc(bx + (s ? s.dx : 0), by + (s ? s.dy : 0), R, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    requestAnimationFrame(tick)
  }

  requestAnimationFrame(tick)
}
