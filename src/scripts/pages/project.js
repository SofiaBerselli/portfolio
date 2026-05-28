import { initTransitionIn, navigateTo } from '../lib/page-transition.js'
import { initVideoLoader } from '../lib/video-loader.js'

if (import.meta.env.DEV) {
  import('../dev/agentation.js')
}

// Reveal the page (overlay fades out)
initTransitionIn()
initVideoLoader()

// ── Scroll progress bar ───────────────────────────────────────────
const progressBar = document.querySelector('.project__progress')
if (progressBar) {
  const updateProgress = () => {
    const total = document.documentElement.scrollHeight - window.innerHeight
    progressBar.style.transform = `scaleX(${total > 0 ? window.scrollY / total : 0})`
  }
  window.addEventListener('scroll', updateProgress, { passive: true })
  updateProgress()
}

// ── Scrollspy — keeps nav item active as sections scroll into view ──
const menuItems = [...document.querySelectorAll('.project__menu-item[href^="#"]')]
const sections  = menuItems.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean)

if (sections.length) {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        const id = entry.target.id
        menuItems.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`))
      })
    },
    { rootMargin: '-20% 0px -60% 0px' }
  )
  sections.forEach(s => observer.observe(s))
}

// ── Panel frame distribution — evenly spaced across total scroll ──
// Each frame occupies 1/N of the scroll journey, regardless of section count.
const panel       = document.querySelector('.project__panel')
const panelFrames = panel ? [...panel.querySelectorAll('.project__panel-frame')] : []

function activateFrame(idx) {
  panelFrames.forEach((f, i) => {
    const active = i === idx
    f.classList.toggle('is-active', active)
    if (f.tagName === 'VIDEO') { active ? f.play() : f.pause() }
  })
}

if (panelFrames.length > 0) {
  let lastIdx = -1
  const updatePanel = () => {
    const total    = document.documentElement.scrollHeight - window.innerHeight
    const progress = total > 0 ? window.scrollY / total : 0
    const idx      = Math.min(Math.floor(progress * panelFrames.length), panelFrames.length - 1)
    if (idx === lastIdx) return
    lastIdx = idx
    activateFrame(idx)
  }
  window.addEventListener('scroll', updatePanel, { passive: true })
  updatePanel()
}

// ── Section menu reveal — fades in after intro is scrolled past ─────
const menuEl = document.querySelector('.project__menu')
if (menuEl && sections.length > 1) {
  const menuObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        menuEl.classList.add('is-revealed')
        menuObserver.disconnect()
      }
    },
    { rootMargin: '0px 0px -20% 0px' }
  )
  menuObserver.observe(sections[1])
}

// ── "Home" link — navigate back skipping the preloader ─────────────
document.querySelector('.project__nav-home')?.addEventListener('click', e => {
  e.preventDefault()
  navigateTo('/?skip')
})

// ── CTA "Jump" — cycle to the next project page ────────────────────
const cta = document.getElementById('project-cta')

const NEXT_ROUTE = {
  '/leica/':   '/blinkoo/',
  '/blinkoo/': '/leica/',
  '/mollie/':  '/leica/',
}

function goNext() {
  navigateTo(NEXT_ROUTE[location.pathname] ?? '/?skip')
}

cta?.addEventListener('click', goNext)

const bunnyIcon = cta?.querySelector('.bunny-icon')
cta?.addEventListener('mouseenter', () => bunnyIcon?.classList.add('is-hovering'))
cta?.addEventListener('mouseleave', () => bunnyIcon?.classList.remove('is-hovering'))
cta?.addEventListener('click', () => {
  if (!bunnyIcon) return
  bunnyIcon.classList.remove('is-jumping')
  void bunnyIcon.offsetWidth
  bunnyIcon.classList.add('is-jumping')
})
bunnyIcon?.addEventListener('animationend', e => {
  if (e.animationName === 'bunnyJump') bunnyIcon.classList.remove('is-jumping')
})

// Enter / Space activate the CTA for keyboard users (div-as-button pattern)
cta?.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    goNext()
  }
})

document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
    e.preventDefault()
    goNext()
  }
})
