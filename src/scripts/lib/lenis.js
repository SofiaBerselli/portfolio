import Lenis from 'lenis'
import { gsap, ScrollTrigger } from './gsap-setup.js'

let lenis

export function initLenis() {
  const isTouch = navigator.maxTouchPoints > 0
  lenis = new Lenis({
    lerp:            isTouch ? 1    : 0.08,
    wheelMultiplier: 1,
    touchMultiplier: 2,
  })

  // Keep GSAP ScrollTrigger in sync with Lenis's scroll position
  lenis.on('scroll', ScrollTrigger.update)

  // Drive Lenis via GSAP's ticker so they share the same rAF loop
  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)

  return lenis
}

export function getLenis() {
  return lenis
}
