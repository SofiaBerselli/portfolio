import { initLenis } from '../lib/lenis.js'
import { initReveal } from '../lib/reveal.js'
import { initNav } from '../components/nav.js'
import { initVideoLoader } from '../lib/video-loader.js'

initNav()
initLenis()
initReveal()
initVideoLoader()

// Three.js is lazy-loaded so its ~600KB bundle never hits the home/works/about pages.
// initScene() is called once the user has scrolled past the intro or clicked into the canvas.
async function initScene() {
  const container = document.getElementById('canvas-container')
  if (!container) return

  // Dynamic import — Vite will split this into its own chunk automatically
  const THREE = await import('three')

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / container.clientHeight,
    0.1,
    100,
  )
  camera.position.z = 3

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  container.appendChild(renderer.domElement)

  // Placeholder geometry — will be replaced with the actual playground spec
  const geo = new THREE.IcosahedronGeometry(1, 1)
  const mat = new THREE.MeshNormalMaterial({ wireframe: true })
  const mesh = new THREE.Mesh(geo, mat)
  scene.add(mesh)

  function tick() {
    requestAnimationFrame(tick)
    mesh.rotation.x += 0.003
    mesh.rotation.y += 0.005
    renderer.render(scene, camera)
  }
  tick()

  // Resize handling
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(container.clientWidth, container.clientHeight)
  })
}

// Load Three.js after the intro section scrolls into the viewport
const observer = new IntersectionObserver(
  (entries) => {
    if (entries[0].isIntersecting) {
      observer.disconnect()
      initScene()
    }
  },
  { threshold: 0.1 },
)

const canvas = document.getElementById('canvas-container')
if (canvas) observer.observe(canvas)
