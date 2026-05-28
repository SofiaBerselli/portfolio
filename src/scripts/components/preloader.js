const FRAMES = [
  {
    // Frame 1 — identity intro, Source Serif 4 Regular, dark cursor
    // A line can be a string, or an array of segments { text, pauseAfter? }
    // to insert a pause mid-line before continuing.
    lines: [
      [{ text: 'Sofia Berselli.' , pauseAfter: 420 }],
      'Designing, ',
      'tinkering.',
    ],
  },
  {
    // Frame 2 — manifesto line, Source Serif 4 Medium, accent cursor
    lines: ['Follow the White Rabbit.'],
    accentCursor: true,
  },
]

const CHAR_MS   = 50   // ms per character typed
const HOLD_MS   = 800  // pause after frame 1 is fully typed
const GAP_MS    = 420  // pause between erase end and frame 2 start
const EXIT_MS   = 800  // pause after frame 2 before fade
const FADE_MS   = 500  // preloader fade-out duration

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

function createLine(output) {
  const line = document.createElement('div')
  line.className = 'preloader__line'
  output.appendChild(line)
  return line
}

async function typeFrame(output, lines) {
  for (const item of lines) {
    const lineEl = createLine(output)
    lineEl.classList.add('is-active')

    // Normalise: a plain string becomes a single segment with no pause
    const segments = Array.isArray(item) ? item : [{ text: item }]

    for (const seg of segments) {
      for (const char of seg.text) {
        lineEl.textContent += char
        await sleep(CHAR_MS)
      }
      if (seg.pauseAfter) await sleep(seg.pauseAfter)
    }

    // Remove is-active from this line only when moving to the next;
    // the last line in the frame keeps is-active so the cursor stays visible.
    if (item !== lines.at(-1)) {
      lineEl.classList.remove('is-active')
    }
  }
}

// Selects all typed lines with an orange highlight, deletes everything
// at once, then leaves a blinking cursor at the start position.
// Returns a cursor-only line element — caller removes it before frame 2.
async function highlightAndErase(output, preloaderEl) {
  const lines = [...output.querySelectorAll('.preloader__line')]
  if (!lines.length) return null

  // 1. Keep cursor on the last line during the highlight phase so it stays
  //    visible (blinking) at the end of "tinkering." while the text is selected.
  lines.slice(0, -1).forEach(l => l.classList.remove('is-active'))

  // 3. Build highlight rectangles over each line
  const base      = preloaderEl.getBoundingClientRect()
  const container = document.createElement('div')
  container.className = 'preloader__hl-container'
  preloaderEl.appendChild(container)

  lines.forEach(line => {
    const r  = line.getBoundingClientRect()
    const hl = document.createElement('div')
    hl.className = 'preloader__hl'
    hl.style.top    = r.top  - base.top  + 'px'
    hl.style.left   = r.left - base.left + 'px'
    hl.style.width  = r.width  + 'px'
    hl.style.height = r.height + 'px'
    container.appendChild(hl)
  })

  // Single rAF ensures elements are painted before the CSS transition fires
  await new Promise(r => requestAnimationFrame(r))
  container.classList.add('is-visible')
  await sleep(480)

  // 4. Delete all text + highlights instantly
  lines.forEach(line => output.removeChild(line))
  container.remove()

  // 5. Place a cursor-only line at position 0 so the cursor blinks at the
  //    start of where frame 2 will type. No movement — just a blinking cursor.
  const cursorLine = document.createElement('div')
  cursorLine.className = 'preloader__line is-active'
  output.appendChild(cursorLine)

  return cursorLine  // caller removes this before frame 2 types
}

export async function initPreloader(onComplete) {
  const el = document.getElementById('preloader')
  if (!el) {
    onComplete?.()
    return
  }

  const output = el.querySelector('.preloader__output')
  if (!output) {
    el.remove()
    document.body.classList.remove('is-loading')
    onComplete?.()
    return
  }

  // Reduced-motion: skip animation entirely
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    await sleep(300)
    el.style.opacity = '0'
    el.style.transition = `opacity ${FADE_MS}ms`
    await sleep(FADE_MS)
    el.remove()
    document.body.classList.remove('is-loading')
    onComplete?.()
    return
  }

  // ── Frame 1 ──────────────────────────────────────────────────────
  await typeFrame(output, FRAMES[0].lines)
  await sleep(HOLD_MS)

  const cursorLine = await highlightAndErase(output, el)
  await sleep(GAP_MS)  // cursor blinks alone at left edge during this pause

  // ── Frame 2 ──────────────────────────────────────────────────────
  // Remove the temporary cursor line before frame 2 creates its own
  if (cursorLine && cursorLine.parentNode) output.removeChild(cursorLine)
  await typeFrame(output, FRAMES[1].lines)
  await sleep(300)

  // ── CTA button ───────────────────────────────────────────────────
  const cta = document.querySelector('.preloader__cta')
  if (cta) {
    cta.classList.add('is-visible')
    cta.removeAttribute('aria-hidden')
  }
  await sleep(EXIT_MS)

  // ── Fade out ─────────────────────────────────────────────────────
  el.style.transition = `opacity ${FADE_MS}ms var(--ease-in-out-quart)`
  el.style.opacity = '0'
  await sleep(FADE_MS)

  el.remove()
  document.body.classList.remove('is-loading')
  onComplete?.()
}
