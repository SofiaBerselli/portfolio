import { gsap, ScrollTrigger, SplitText } from '../lib/gsap-setup.js'
import { initPreloader }               from '../components/preloader.js'
import { initTransitionIn } from '../lib/page-transition.js'
import { initDotCanvas }               from '../lib/dot-canvas.js'
import { initVideoLoader }             from '../lib/video-loader.js'

if (import.meta.env.DEV) {
  import('../dev/agentation.js')
}

// ── Company data ───────────────────────────────────────────────────
const COMPANIES = [
  { name: 'Mollie',             color: '#FF6B35', href: null               },
  { name: 'Leica Camera',       color: '#A81820', href: '/leica/'   },
  { name: 'blinkoo',            color: '#5B4FE9', href: '/blinkoo/' },
  { name: '& other fun places', color: '#F8F7F4', href: null        },
]
const LAST_IDX = COMPANIES.length - 1

// ── Visual constants ───────────────────────────────────────────────
const SIZE_MIN   = 18
const SIZE_MAX   = 36
const LERP_SLOTS = 3.2

function sizeBounds() {
  return window.innerWidth < 640 ? { min: 14, max: 28 } : { min: SIZE_MIN, max: SIZE_MAX }
}

// ── Scroll constants ───────────────────────────────────────────────
// How many px of page scroll corresponds to advancing one company.
// LAST_EXTRA gives extra dwell time on the final item so logos are visible.
const SCROLL_PER_COMPANY = 380
const LAST_EXTRA          = 200

// ── DOM ────────────────────────────────────────────────────────────
const homeWrapper = document.getElementById('home-wrapper')
const home        = document.getElementById('home')
const track       = document.getElementById('company-track')
const panelLeft   = document.getElementById('panel-left')
const panelRight  = document.getElementById('panel-right')
const items       = [...track.querySelectorAll('.home__item')]
const names       = items.map(el => el.querySelector('.home__item-name'))

const logosLeft   = [...document.querySelectorAll('#logos-left  .panel-logo')]
const logosRight  = [...document.querySelectorAll('#logos-right .panel-logo')]
const logosMobile = [...document.querySelectorAll('#logos-mobile .panel-logo')]

const framesLeft  = [...document.querySelectorAll('#panel-left  .panel-frame')]
const framesRight = [...document.querySelectorAll('#panel-right .panel-frame')]

// ── Building cursor pill ───────────────────────────────────────────
const pill = document.createElement('div')
pill.className = 'building-pill'
pill.setAttribute('aria-hidden', 'true')
pill.innerHTML = '<span class="building-pill__text"></span><span class="building-pill__cursor"></span>'
document.body.appendChild(pill)

const pillText = pill.querySelector('.building-pill__text')
const PILL_LABELS = ['building', 'rabbithole', 'rabbithole']

let pillX = 0, pillY = 0
let overItemIdx = -1, overPanel = false, pillEnabled = false
let scrollPillActive = false

document.addEventListener('mousemove', e => {
  pillX = e.clientX
  pillY = e.clientY
  pill.style.transform = `translate(${pillX + 14}px, ${pillY - 12}px)`
})

function updatePill() {
  if (scrollPillActive) return
  const show = pillEnabled && (overItemIdx === active || overPanel) && active < LAST_IDX
  if (show) pillText.textContent = PILL_LABELS[active]
  pill.classList.toggle('is-visible', show)
}

function showScrollPill() {
  const word = 'Scroll'
  scrollPillActive = true
  pillText.textContent = ''
  pill.classList.add('is-visible')

  let i = 0
  function typeNext() {
    if (i < word.length) {
      pillText.textContent = word.slice(0, i + 1)
      i++
      setTimeout(typeNext, 55)
    }
  }
  typeNext()

  setTimeout(() => {
    scrollPillActive = false
    pill.classList.remove('is-visible')
    updatePill()
  }, 2000)
}

function preloadVideos(idx) {
  const l = framesLeft.find(el  => el.dataset.company === String(idx))
  const r = framesRight.find(el => el.dataset.company === String(idx))
  if (l?.tagName === 'VIDEO') l.load()
  if (r?.tagName === 'VIDEO') r.load()
}

function showFrames(idx) {
  const l = framesLeft.find(el  => el.dataset.company === String(idx))
  const r = framesRight.find(el => el.dataset.company === String(idx))
  if (l) {
    gsap.to(l, { opacity: 1, duration: 0.3, ease: 'power2.out' })
    if (l.tagName === 'VIDEO') l.play()
  }
  if (r) {
    gsap.to(r, { opacity: 1, duration: 0.3, ease: 'power2.out', delay: 0.05 })
    if (r.tagName === 'VIDEO') r.play()
  }
  preloadVideos(idx + 1)
}


// Left has 4 logos (rows of 2+2), right has 6 (rows of 3+3)
const LOGO_STAGGER_ORDER = [
  logosRight[0], logosRight[1], logosRight[2],   // right row 1
  logosLeft[0],  logosLeft[1],                   // left row 1
  logosRight[3], logosRight[4], logosRight[5],   // right row 2
  logosLeft[2],  logosLeft[3],                   // left row 2
  ...logosMobile,                                 // mobile-only grid
]

function showLogos() {
  gsap.fromTo(LOGO_STAGGER_ORDER,
    { opacity: 0, y: 5 },
    { opacity: 0.7, y: 0, duration: 0.3, ease: 'power2.out', stagger: 0.045 }
  )
}
function hideLogos() {
  gsap.to(LOGO_STAGGER_ORDER,
    { opacity: 0, y: 3, duration: 0.18, ease: 'power2.in', stagger: 0.025, overwrite: 'auto' }
  )
}

let active   = -1
let SLOT     = items[0]?.offsetHeight ?? 120
let currentY = 0
let panelTl  = null

const setTrackY = gsap.quickSetter(track, 'y', 'px')

// ── Geometry ───────────────────────────────────────────────────────
function itemCenter(el) {
  return el.offsetTop + el.offsetHeight / 2
}

function trackY(index) {
  return window.innerHeight / 2 - itemCenter(items[index])
}

// ── Wrapper height ─────────────────────────────────────────────────
// Total = one viewport (first view) + scroll distance through all companies
function updateWrapperHeight() {
  const lastExtra = window.innerWidth < 640 ? 80 : LAST_EXTRA
  homeWrapper.style.height =
    window.innerHeight + SCROLL_PER_COMPANY * LAST_IDX + lastExtra + 'px'
}

// ── Scroll → track position ────────────────────────────────────────
// Maps window.scrollY linearly to a track Y value, interpolating
// between adjacent item centres for a smooth continuous transition.
function scrollToTrackY(scrollY) {
  const progress = Math.max(0, Math.min(LAST_IDX, scrollY / SCROLL_PER_COMPANY))
  const i0       = Math.min(Math.floor(progress), LAST_IDX)
  const i1       = Math.min(i0 + 1, LAST_IDX)
  const t        = progress - i0
  const center   = itemCenter(items[i0]) + (itemCenter(items[i1]) - itemCenter(items[i0])) * t
  return window.innerHeight / 2 - center
}

// ── Speculative loading — prerender on Chrome 109+, prefetch elsewhere ──
const _speculatedHrefs = new Set()

function prefetchOrPrerender(href) {
  if (_speculatedHrefs.has(href)) return
  _speculatedHrefs.add(href)

  if (HTMLScriptElement.supports?.('speculationrules')) {
    const spec = document.createElement('script')
    spec.type = 'speculationrules'
    spec.textContent = JSON.stringify({ prerender: [{ urls: [href] }] })
    document.head.appendChild(spec)
  } else {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = href
    document.head.appendChild(link)
  }
}

// ── Per-frame visual update ────────────────────────────────────────
function updateVisuals() {
  const vh    = window.innerHeight
  const range = SLOT * LERP_SLOTS
  const { min: sMin, max: sMax } = sizeBounds()
  let closestIdx = 0, minDist = Infinity

  names.forEach((name, i) => {
    const dist = Math.abs(currentY + itemCenter(items[i]) - vh / 2)
    const t    = Math.max(0, 1 - dist / range)
    name.style.fontSize = sMin + (sMax - sMin) * t + 'px'
    if (dist < minDist) { minDist = dist; closestIdx = i }
  })

  if (closestIdx !== active) {
    const prev = active
    active = closestIdx
    updatePill()
    const _href = COMPANIES[active]?.href
    if (_href) prefetchOrPrerender(_href)
    const panelCursor = COMPANIES[active]?.href ? 'pointer' : 'default'
    panelLeft.style.cursor  = panelCursor
    panelRight.style.cursor = panelCursor
    items.forEach((el, i) => {
      el.classList.toggle('is-active', i === active)
      if (i !== active) el.classList.remove('is-link-ready')
    })
    if (active !== LAST_IDX && COMPANIES[active].href) items[active].classList.add('is-link-ready')

    if (panelTl) panelTl.kill()
    gsap.killTweensOf([panelLeft, panelRight])
    gsap.killTweensOf([...framesLeft, ...framesRight])
    gsap.set([panelLeft, panelRight], { opacity: 1 })
    // is-logos is toggled inside each timeline (when panels are at opacity 0)
    // so the width change is never visible. No eager sync here.

    // CTA hover word flips between "Next" and "CV" at the last company
    setCTAContext(ctaState())

    if (active === LAST_IDX) {
      // Instantly zero all frames — the panel flash is the visual cover,
      // a gradual frame fade would bleed through when the panel returns.
      gsap.set(LOGO_STAGGER_ORDER, { opacity: 0 })
      gsap.set([...framesLeft, ...framesRight], { opacity: 0 })
      panelTl = gsap.timeline()
        .to([panelLeft, panelRight],  { opacity: 0, duration: 0.06, ease: 'none' })
        .call(() => {
          panelLeft.classList.add('is-logos')
          panelRight.classList.add('is-logos')
        })
        .set([panelLeft, panelRight], { backgroundColor: COMPANIES[LAST_IDX].color })
        .to([panelLeft, panelRight],  { opacity: 1, duration: 0.06, ease: 'none' })
        .call(showLogos)
    } else if (prev === LAST_IDX) {
      hideLogos()
      panelTl = gsap.timeline()
        .to([panelLeft, panelRight],  { opacity: 0, duration: 0.06, ease: 'none' })
        .call(() => {
          panelLeft.classList.remove('is-logos')
          panelRight.classList.remove('is-logos')
        })
        .set([panelLeft, panelRight], { backgroundColor: '#F7F7F4' })
        .to([panelLeft, panelRight],  { opacity: 1, duration: 0.06, ease: 'none' })
        .call(() => showFrames(active))
    } else {
      const prevL = prev >= 0 ? framesLeft.find(el  => el.dataset.company === String(prev)) : null
      const prevR = prev >= 0 ? framesRight.find(el => el.dataset.company === String(prev)) : null
      const nextL = framesLeft.find(el  => el.dataset.company === String(active))
      const nextR = framesRight.find(el => el.dataset.company === String(active))

      panelTl = gsap.timeline()
        .to([panelLeft, panelRight], { opacity: 0, duration: 0.12, ease: 'power2.in' })
        .call(() => {
          gsap.set([prevL, prevR].filter(Boolean), { opacity: 0 })
          if (prevL?.tagName === 'VIDEO') prevL.pause()
          if (prevR?.tagName === 'VIDEO') prevR.pause()
          gsap.set([panelLeft, panelRight], { backgroundColor: '#F7F7F4' })
          if (nextL?.tagName === 'VIDEO') nextL.play()
          if (nextR?.tagName === 'VIDEO') nextR.play()
          gsap.set([nextL, nextR].filter(Boolean), { opacity: 1 })
        })
        .to([panelLeft, panelRight], { opacity: 1, duration: 0.25, ease: 'power2.out' })
    }
  }
}

// ── Scroll handler — drives everything ────────────────────────────
function onScroll() {
  currentY = scrollToTrackY(window.scrollY)
  setTrackY(currentY)
  updateVisuals()
  setCTAContext(ctaState())
}
window.addEventListener('scroll', onScroll, { passive: true })

// ── Navigation to project pages ───────────────────────────────────
// Navigate directly (no overlay) so the View Transitions API can
// capture the home panel and morph it into the project panel.
function navigateToCompany(index) {
  const href = COMPANIES[index]?.href
  if (!href) return
  sessionStorage.setItem('vt-panel', '1')
  window.location.href = href
}

// ── Click — company label: scroll into focus first, then navigate ──
items.forEach((el, i) => {
  el.addEventListener('click', () => {
    if (i === active) {
      navigateToCompany(i)
    } else {
      window.scrollTo({ top: i * SCROLL_PER_COMPANY, behavior: 'smooth' })
    }
  })
})

// ── Click — either panel navigates to the currently active company ─
panelLeft.style.cursor  = 'default'
panelRight.style.cursor = 'default'
;[panelLeft, panelRight].forEach(panel => {
  panel.addEventListener('click', () => navigateToCompany(active))
})

// ── Cursor pill — hover targets (all case-study items + panels) ───
items.slice(0, LAST_IDX).forEach((item, i) => {
  item.addEventListener('mouseenter', () => { overItemIdx = i;  updatePill() })
  item.addEventListener('mouseleave', () => { overItemIdx = -1; updatePill() })
})
;[panelLeft, panelRight].forEach(panel => {
  panel.addEventListener('mouseenter', () => { overPanel = true;  updatePill() })
  panel.addEventListener('mouseleave', () => { overPanel = false; updatePill() })
})

// ── Back-to-works bar + orange scrollbar ──────────────────────────
// Observed across both the experience and about sections.
const experienceEl = document.getElementById('experience')
const bioEl        = document.getElementById('bio')
const funEl        = document.getElementById('fun')
const aboutEl      = document.getElementById('about')
const galleryEl    = document.getElementById('gallery')
const backBar      = document.getElementById('back-bar')
const backBarBtn   = document.getElementById('back-bar-btn')

let expVisible = false, bioVisible = false, funVisible = false, aboutVisible = false

// ── CTA button ─────────────────────────────────────────────────────
const cta        = document.querySelector('.preloader__cta')
const ctaLabel   = cta?.querySelector('.preloader__cta-label')
const ctaWordOne = document.getElementById('cta-word-default')
const ctaWordTwo = document.getElementById('cta-word-hover')

// Returns the section whose bounds contain the viewport's vertical midpoint.
// This is precise: only one section can contain the midpoint at any scroll position,
// so there's no ambiguity even when multiple sections are partially visible.
function ctaState() {
  const mid = window.innerHeight / 2
  for (const [el, key] of [
    [galleryEl,    'gallery'   ],
    [aboutEl,      'about'     ],
    [funEl,        'fun'       ],
    [bioEl,        'bio'       ],
    [experienceEl, 'experience'],
  ]) {
    if (!el) continue
    const r = el.getBoundingClientRect()
    if (r.top <= mid && r.bottom >= mid) return key
  }
  return 'home'
}

const CTA_CONFIG = {
  home:        { word: 'Jump',  hover: 'Approach',   target: () => experienceEl },
  experience:  { word: 'Jump',  hover: 'About',      target: () => bioEl        },
  bio:         { word: 'Jump',  hover: 'Fun',        target: () => funEl        },
  fun:         { word: 'Jump',  hover: 'Rabbit',     target: () => aboutEl      },
  about:       { word: 'Case',  hover: 'Leica',      target: null, href: '/leica/' },
  gallery:     { word: 'Jump',  hover: 'Top',        target: null               },
}

// Cache key includes active company index when in home state so the button
// refreshes as the user cycles through companies.
let lastCTAKey = ''

function setCTAContext(state) {
  const key = state === 'home' ? `home-${active}` : state
  if (!ctaLabel || key === lastCTAKey) return
  lastCTAKey = key

  let word, hover
  if (state === 'home' && active < LAST_IDX) {
    word  = 'Jump'
    hover = 'Next'
  } else {
    ;({ word, hover } = CTA_CONFIG[state])
  }

  ctaLabel.style.opacity = '0'

  setTimeout(() => {
    if (!cta) return

    // Measure current rendered width before touching the text
    const fromWidth = cta.offsetWidth

    // Swap text, then measure the new natural width
    if (ctaWordOne) ctaWordOne.textContent = word
    if (ctaWordTwo) ctaWordTwo.textContent = hover
    cta.style.width = 'auto'
    void cta.offsetWidth               // force reflow so browser computes new layout
    const toWidth = cta.offsetWidth

    // Pin back to the old width so GSAP has a start value
    cta.style.width = fromWidth + 'px'
    void cta.offsetWidth               // second reflow to commit the starting point

    // Animate to the new width; leave the explicit px on the element so the
    // next measurement always starts from a reliable value.
    gsap.to(cta, {
      width: toWidth,
      duration: 0.4,
      ease: 'expo.out',
      overwrite: 'auto',
    })

    ctaLabel.style.opacity = '1'
  }, 180)
}

// ── Keyboard shortcut — ⌘J / Ctrl+J acts as a button click ────────
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
    if (cta?.classList.contains('is-visible')) {
      e.preventDefault()
      cta.click()
    }
  }
})

// ── Arrow keys navigate the company track ─────────────────────────
document.addEventListener('keydown', e => {
  if (expVisible || bioVisible || funVisible || aboutVisible) return
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
  e.preventDefault()
  const next = e.key === 'ArrowDown'
    ? Math.min(active + 1, LAST_IDX)
    : Math.max(active - 1, 0)
  if (next !== active) window.scrollTo({ top: next * SCROLL_PER_COMPANY, behavior: 'smooth' })
})

// Enter / Space activate the CTA for keyboard users (div-as-button pattern)
cta?.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    cta.click()
  }
})

cta?.addEventListener('click', () => {
  const state = ctaState()

  // Home state: always scroll to the next company
  if (state === 'home' && active < LAST_IDX) {
    window.scrollTo({ top: (active + 1) * SCROLL_PER_COMPANY, behavior: 'smooth' })
    return
  }

  const cfg = CTA_CONFIG[state] ?? CTA_CONFIG.home
  if (cfg.href) {
    window.location.href = cfg.href
    return
  }
  const el = cfg.target?.()
  if (el) {
    const rect = el.getBoundingClientRect()
    const scrollTop = rect.top + window.scrollY - (window.innerHeight - rect.height) / 2
    window.scrollTo({ top: Math.max(0, scrollTop), behavior: 'smooth' })
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
})

const bunnyIcon = cta?.querySelector('.bunny-icon')
cta?.addEventListener('click', () => {
  if (!bunnyIcon) return
  bunnyIcon.classList.remove('is-jumping')
  void bunnyIcon.offsetWidth
  bunnyIcon.classList.add('is-jumping')
})
bunnyIcon?.addEventListener('animationend', e => {
  if (e.animationName === 'bunnyJump') bunnyIcon.classList.remove('is-jumping')
})
cta?.addEventListener('mouseenter', () => bunnyIcon?.classList.add('is-hovering'))
cta?.addEventListener('mouseleave', () => bunnyIcon?.classList.remove('is-hovering'))

function updateBackBar() {
  const show = expVisible || bioVisible || funVisible || aboutVisible
  document.body.classList.toggle('experience-active', show)
  backBar?.classList.toggle('is-visible', show)
  if (backBar) backBar.setAttribute('aria-hidden', String(!show))
  setCTAContext(ctaState())
}

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.target === experienceEl) expVisible   = entry.isIntersecting
      if (entry.target === bioEl)        bioVisible   = entry.isIntersecting
      if (entry.target === funEl)        funVisible   = entry.isIntersecting
      if (entry.target === aboutEl)      aboutVisible = entry.isIntersecting
    })
    updateBackBar()
  },
  { threshold: 0.01 }
)
// Observation starts inside initHome(), AFTER updateWrapperHeight() has run,
// so the observer never fires with a false positive during the preloader.

backBarBtn?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

// ── Gallery tile 3D tilt on hover ─────────────────────────────────
function initGalleryTilt() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const MAX_TILT = 6
  const LERP     = 0.12

  const tile = document.querySelector('.gallery__tile--r2')
  if (!tile) return
  {
    const fg = tile.querySelector('.gallery__tile-fg')
    if (!fg) return

    let raf = null
    let tx = 0, ty = 0
    let cx = 0, cy = 0
    let hovering = false

    function tick() {
      cx += (tx - cx) * LERP
      cy += (ty - cy) * LERP

      if (!hovering && Math.abs(cx) < 0.01 && Math.abs(cy) < 0.01) {
        cx = 0; cy = 0
        fg.style.transform = ''
        raf = null
        return
      }

      fg.style.transform = `perspective(700px) rotateX(${cx}deg) rotateY(${cy}deg)`
      raf = requestAnimationFrame(tick)
    }

    tile.addEventListener('mousemove', e => {
      hovering = true
      const r = tile.getBoundingClientRect()
      tx = -((e.clientY - r.top)  / r.height - 0.5) * 2 * MAX_TILT
      ty =  ((e.clientX - r.left) / r.width  - 0.5) * 2 * MAX_TILT
      if (!raf) raf = requestAnimationFrame(tick)
    })

    tile.addEventListener('mouseleave', () => {
      hovering = false
      tx = 0; ty = 0
      if (!raf) raf = requestAnimationFrame(tick)
    })
  }
}

// ── Gallery scroll reveals ─────────────────────────────────────────
function initGalleryReveal() {
  const title = document.querySelector('.gallery__title')
  if (title) {
    gsap.fromTo(title,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: title, start: 'top 88%', once: true } }
    )
  }

  const wraps = [...document.querySelectorAll('.gallery__wrap')]
  if (!wraps.length) return

  const leftWraps  = wraps.filter(w => w.closest('.gallery__col:first-child'))
  const rightWraps = wraps.filter(w => w.closest('.gallery__col:last-child'))

  const animOpts = (delay = 0) => ({
    opacity: 1, y: 0, duration: 0.75, stagger: 0.1, ease: 'expo.out', delay,
    scrollTrigger: { trigger: wraps[0], start: 'top 85%', once: true },
  })

  gsap.fromTo(leftWraps,  { opacity: 0, y: 48 }, animOpts(0))
  gsap.fromTo(rightWraps, { opacity: 0, y: 48 }, animOpts(0.06))
}

// ── Experience scroll reveals ──────────────────────────────────────
function initExperienceReveal() {
  ScrollTrigger.refresh()

  const FROM     = { opacity: 0, y: 16, filter: 'blur(8px)' }
  const TO_LINES = { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.45, ease: 'power3.out', stagger: 0.05 }
  const TO_ROWS  = { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', stagger: 0.07 }

  document.querySelectorAll('.experience__block').forEach((block, i) => {
    const textEls  = [...block.querySelectorAll(
      '.experience__label, .experience__summary, .experience__text p, ' +
      '.experience__win-title, .experience__win-sub, ' +
      '.about__label, .about__text p, .bio__label'
    )]
    const listItems = [...block.querySelectorAll('.experience__item')]

    if (!textEls.length && !listItems.length) return

    gsap.set(block, { opacity: 1 }) // parent visible; children animate from hidden
    const ST = { trigger: block, start: 'top 82%', toggleActions: 'play none none reverse' }

    if (textEls.length) {
      const allLines = textEls.flatMap(el => new SplitText(el, { type: 'lines' }).lines)
      gsap.fromTo(allLines, FROM, { ...TO_LINES, delay: i === 0 ? 0.1 : 0, scrollTrigger: ST })
    }

    if (listItems.length) {
      gsap.set(listItems, { opacity: 0, y: 12 })
      gsap.to(listItems, { ...TO_ROWS, scrollTrigger: ST })
    }
  })

  // Bio section — split paragraphs line-by-line
  const bioContent = document.querySelector('.bio__content')
  if (bioContent) {
    gsap.set(bioContent, { opacity: 1 })
    const lines = [...bioContent.querySelectorAll('p')]
      .flatMap(p => new SplitText(p, { type: 'lines' }).lines)
    if (lines.length) {
      gsap.fromTo(lines, FROM, {
        ...TO_LINES,
        scrollTrigger: { trigger: bioContent, start: 'top 82%', toggleActions: 'play none none reverse' },
      })
    }
  }

  // Signature handwriting reveal (clip-path, not blur — unchanged)
  const aboutSection = document.getElementById('about')
  const aboutBlock   = aboutSection?.querySelector('.about__block')
  const sig = document.querySelector('.about__signature')
  if (sig && aboutBlock) {
    gsap.to(sig, {
      clipPath: 'inset(0 0% 0 0)',
      duration: 2.4,
      ease: 'power2.inOut',
      scrollTrigger: {
        trigger: aboutBlock,
        start: 'top center',
        toggleActions: 'play none none reverse',
      },
    })
  }
}

// ── Resize ─────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  SLOT = items[0]?.offsetHeight ?? 120
  updateWrapperHeight()
  onScroll()
})

// ── Reusable photo cluster: hover/click/bounce/hint ───────────────
function initPhotoCluster(photosEl, panelEl, hoverEl = photosEl, secondaryPanelEl = null) {
  if (!photosEl || !panelEl) return null
  let locked = false

  const show = () => {
    panelEl.classList.add('is-visible'); panelEl.setAttribute('aria-hidden', 'false')
    secondaryPanelEl?.classList.add('is-visible'); secondaryPanelEl?.setAttribute('aria-hidden', 'false')
  }
  const hide = () => {
    panelEl.classList.remove('is-visible')
    panelEl.setAttribute('aria-hidden', 'true')
    panelEl.querySelectorAll('.approach__photo-wrap').forEach(w => { w.style.zIndex = '' })
    secondaryPanelEl?.classList.remove('is-visible'); secondaryPanelEl?.setAttribute('aria-hidden', 'true')
  }

  hoverEl.addEventListener('mouseenter', show)
  hoverEl.addEventListener('mouseleave', () => { if (!locked) hide() })
  photosEl.addEventListener('click', () => { locked = !locked; locked ? show() : hide() })
  photosEl.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      locked = !locked
      locked ? show() : hide()
    }
  })

  const photoWraps = [...panelEl.querySelectorAll('.approach__photo-wrap')]
  photoWraps.forEach(wrap => {
    wrap.addEventListener('click', e => {
      e.stopPropagation()
      photoWraps.forEach(w => { w.style.zIndex = '' })
      wrap.style.zIndex = 10
      gsap.from(wrap, { scale: 1.07, duration: 0.55, ease: 'back.out(2.5)', overwrite: 'auto' })
      photoWraps.forEach(w => {
        if (w === wrap) return
        gsap.from(w, { y: 5, duration: 0.45, ease: 'back.out(2)', overwrite: 'auto' })
      })
    })
  })

  ScrollTrigger.create({
    trigger: photosEl,
    start: 'top 82%',
    once: true,
    onEnter: () => {
      setTimeout(() => {
        photosEl.classList.add('is-hinting')
        setTimeout(() => photosEl.classList.remove('is-hinting'), 500)
      }, 600)
    },
  })

  return {
    isLocked: () => locked,
    close:    () => { locked = false; hide() },
    contains: el => hoverEl.contains(el) || panelEl.contains(el) || !!secondaryPanelEl?.contains(el),
  }
}

// ── Post-preloader setup (shared by normal and skip paths) ─────────
function initHome() {
  pillEnabled = true
  SLOT = items[0]?.offsetHeight ?? 120
  updateWrapperHeight()

  // Preload panel videos for companies 0 and 1 immediately (during preloader phase)
  preloadVideos(0)
  preloadVideos(1)
  initVideoLoader()

  // Set initial track position (company 0 centred, no entrance animation)
  currentY = trackY(0)
  gsap.set(track, { xPercent: -50, y: currentY })
  gsap.set([panelLeft, panelRight], { backgroundColor: '#F7F7F4' })
  showFrames(0)

  // Set correct initial CTA text and pin width before updateVisuals() so the
  // button appears at the right size immediately — not at the HTML default then
  // shrinking when setCTAContext fires for the first time.
  if (ctaWordOne) ctaWordOne.textContent = 'Jump'
  if (ctaWordTwo) ctaWordTwo.textContent = 'Next'
  lastCTAKey = 'home-0'
  if (cta) cta.style.width = cta.offsetWidth + 'px'

  updateVisuals()

  // Fade in home section
  gsap.to(home, { opacity: 1, duration: 0.55, ease: 'power2.out', delay: 0.05 })

  // Panels appear after text settles
  gsap.to([panelLeft, panelRight], {
    opacity: 1,
    duration: 0.7,
    ease: 'power2.out',
    delay: 0.6,
    stagger: 0.1,
  })

  // Init experience + gallery reveals — fonts.ready ensures SplitText line-breaks match rendered output
  document.fonts.ready.then(() => {
    initExperienceReveal()
    initGalleryReveal()
    initGalleryTilt()
  })

  // Start observing sections only now — wrapper height is set, so no
  // false-positive intersections that would flash the back bar.
  if (experienceEl) sectionObserver.observe(experienceEl)
  if (bioEl)        sectionObserver.observe(bioEl)
  if (funEl)        sectionObserver.observe(funEl)
  if (aboutEl)      sectionObserver.observe(aboutEl)

  // ── Photo clusters (Approach + Behind the pixels) ────────────────
  const clusters = [
    initPhotoCluster(document.getElementById('approach-photos'), document.getElementById('approach-panel'), document.querySelector('#experience .approach__header'), document.getElementById('approach-panel-left')),
    initPhotoCluster(document.getElementById('bio-photos'),      document.getElementById('bio-panel'),      document.querySelector('#bio .approach__header')),
  ].filter(Boolean)

  document.addEventListener('click', e => {
    clusters.forEach(c => { if (c.isLocked() && !c.contains(e.target)) c.close() })
  })

  // ── LinkedIn hover card ─────────────────────────────────────────
  const linkedinLink = document.querySelector('.about__text a[href*="linkedin"]')
  if (linkedinLink) {
    const linkedinHover = document.createElement('div')
    linkedinHover.className = 'linkedin-hover'
    linkedinHover.setAttribute('aria-hidden', 'true')
    linkedinHover.innerHTML = '<img src="/about/linkedin-hover.gif" alt="" loading="eager">'
    document.body.appendChild(linkedinHover)

    document.addEventListener('mousemove', e => {
      linkedinHover.style.left = (e.clientX + 20) + 'px'
      linkedinHover.style.top  = (e.clientY - 80) + 'px'
    })

    linkedinLink.addEventListener('mouseenter', () => linkedinHover.classList.add('is-visible'))
    linkedinLink.addEventListener('mouseleave', () => linkedinHover.classList.remove('is-visible'))
  }

  initDotCanvas()

  // Scroll pill — type "Scroll" for 2 s right after the preloader ends.
  // Not shown on the back-navigation skip path.
  if (!new URLSearchParams(location.search).has('skip')) {
    showScrollPill()
  }
}

// ── Skip preloader when arriving from a project page (?skip) ───────
if (new URLSearchParams(location.search).has('skip')) {
  document.getElementById('preloader')?.remove()
  document.body.classList.remove('is-loading')
  const ctaEl = document.querySelector('.preloader__cta')
  if (ctaEl) { ctaEl.classList.add('is-visible'); ctaEl.removeAttribute('aria-hidden') }
  initTransitionIn()
  initHome()
} else {
  initPreloader(initHome)
}
