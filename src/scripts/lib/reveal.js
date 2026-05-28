import { gsap, ScrollTrigger, SplitText } from './gsap-setup.js'

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Split and animate a text element line by line on scroll.
 * @param {Element} el
 * @param {object} [opts]
 * @param {number} [opts.delay=0]
 * @param {string} [opts.start='top 85%']
 */
export function revealText(el, { delay = 0, start = 'top 85%' } = {}) {
  if (REDUCED_MOTION) {
    gsap.set(el, { opacity: 1 })
    return
  }

  const split = new SplitText(el, { type: 'lines', linesClass: 'line' })

  // Clip each line so we can slide from below
  gsap.set(split.lines, { overflow: 'hidden' })

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: el,
      start,
      once: true,
    },
    delay,
  })

  tl.fromTo(
    split.lines,
    { yPercent: 110, opacity: 0 },
    {
      yPercent: 0,
      opacity: 1,
      duration: 1,
      stagger: 0.08,
      ease: 'expo.out',
      onComplete() {
        split.revert()
        gsap.set(el, { opacity: 1 })
      },
    },
  )

  return tl
}

/**
 * Fade + slide up a set of elements on scroll.
 * @param {string|Element|NodeList} target
 * @param {object} [opts]
 * @param {number} [opts.stagger=0.1]
 * @param {string} [opts.start='top 85%']
 */
export function revealElements(target, { stagger = 0.1, start = 'top 85%' } = {}) {
  const els = typeof target === 'string' ? document.querySelectorAll(target) : target

  if (!els.length && !els.nodeType) return
  if (REDUCED_MOTION) {
    gsap.set(els, { opacity: 1, y: 0 })
    return
  }

  gsap.fromTo(
    els,
    { opacity: 0, y: 32 },
    {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: typeof els.length !== 'undefined' ? els[0] : els,
        start,
        once: true,
      },
    },
  )
}

/**
 * Run all [data-reveal] elements on the page through the appropriate reveal.
 * Call once per page after DOM is ready.
 */
export function initReveal() {
  document.querySelectorAll('[data-reveal="split"]').forEach((el) => revealText(el))
  document.querySelectorAll('[data-reveal="fade"]').forEach((el) => {
    gsap.set(el, { opacity: 0, y: 24 })
    revealElements(el)
  })
}
