export function initNav() {
  const nav = document.getElementById('nav')
  const toggle = nav?.querySelector('.nav__toggle')
  const links = nav?.querySelector('.nav__links')

  if (!nav) return

  // Mark active link based on current path
  const path = window.location.pathname
  nav.querySelectorAll('.nav__link').forEach((link) => {
    const href = link.getAttribute('href')
    const isActive =
      href === '/' ? path === '/' || path === '/index.html' : path.startsWith(href)
    if (isActive) link.setAttribute('aria-current', 'page')
  })

  // Mobile toggle
  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true'
    toggle.setAttribute('aria-expanded', String(!open))
    nav.classList.toggle('is-open', !open)
  })

  // Close on link click (mobile)
  links?.querySelectorAll('.nav__link').forEach((link) => {
    link.addEventListener('click', () => {
      toggle?.setAttribute('aria-expanded', 'false')
      nav.classList.remove('is-open')
    })
  })

  // Set current year in footer
  const yearEl = document.getElementById('year')
  if (yearEl) yearEl.textContent = new Date().getFullYear()
}
