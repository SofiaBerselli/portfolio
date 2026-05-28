import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(ScrollTrigger, SplitText)

// Default ease matching the CSS token --ease-out-expo
gsap.defaults({ ease: 'expo.out', duration: 0.8 })

// Respect prefers-reduced-motion globally
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  gsap.globalTimeline.timeScale(100)
}

export { gsap, ScrollTrigger, SplitText }
