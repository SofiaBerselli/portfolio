const DURATION_OUT = 450   // ms — overlay fade before nav (fallback only)
const DURATION_IN  = 650   // ms — overlay reveal on new page (fallback only)

let overlay = null

function getOverlay() {
  if (overlay) return overlay
  overlay = document.createElement('div')
  overlay.id = 'pt-overlay'
  document.body.appendChild(overlay)
  return overlay
}

const hasViewTransitions = 'startViewTransition' in document

// Call on every new page load — fades the overlay out to reveal the page.
// Skipped when the browser handles the reveal via the View Transitions API.
export function initTransitionIn() {
  if (hasViewTransitions) return

  const el = getOverlay()
  el.style.opacity    = '1'
  el.style.transition = 'none'
  el.style.pointerEvents = 'all'
  requestAnimationFrame(() => requestAnimationFrame(() => {
    el.style.transition    = `opacity ${DURATION_IN}ms cubic-bezier(0.16, 1, 0.3, 1)`
    el.style.opacity       = '0'
    el.style.pointerEvents = 'none'
  }))
}

// Call before any navigation — navigates immediately when view-transitions are
// available so the browser can capture the panel for the morph snapshot.
// Falls back to an overlay fade for browsers without view-transition support.
export function navigateTo(href) {
  if (!href) return

  if (hasViewTransitions) {
    window.location.href = href
    return
  }

  const el = getOverlay()
  el.style.pointerEvents = 'all'
  el.style.transition    = `opacity ${DURATION_OUT}ms ease-in`
  el.style.opacity       = '1'
  setTimeout(() => { window.location.href = href }, DURATION_OUT)
}
