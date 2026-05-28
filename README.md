# Sofia Berselli — Portfolio

Static site built with **Vite + vanilla JS + GSAP + Lenis + Three.js**.  
Hosted on **Cloudflare Pages** with domain kept at **GoDaddy**.

---

## Local development

```bash
npm install       # once
npm run dev       # start dev server at http://localhost:5173
```

Pages:
- `/` — Home
- `/works/` — Works
- `/about/` — About
- `/playground/` — Digital playground

---

## Build & preview

```bash
npm run build     # outputs to dist/
npm run preview   # serve dist/ locally at http://localhost:4173
```

Check that `dist/assets/` contains a separate `three-*.js` chunk (Three.js should not be bundled into home/works/about).

```bash
npx vite-bundle-visualizer   # visual bundle breakdown
```

---

## Deploy to Cloudflare Pages

### Initial setup (once)

1. Push the repo to GitHub or GitLab.
2. In [Cloudflare Pages](https://pages.cloudflare.com/) → Create a project → Connect repo.
3. Build settings:
   - Framework preset: None
   - Build command: `npm run build`
   - Output directory: `dist`
4. Save & deploy. You get a `*.pages.dev` preview URL immediately.

### Subsequent deploys

Push to your main branch — Cloudflare Pages auto-deploys on push.

---

## Custom domain (GoDaddy → Cloudflare Pages)

**Path A — Move DNS to Cloudflare (recommended, keeps domain at GoDaddy):**

1. Create a free [Cloudflare](https://cloudflare.com) account.
2. Add your domain as a new site in Cloudflare → it gives you 2 nameservers.
3. In GoDaddy → Domain Settings → Nameservers → "Change" → paste Cloudflare's nameservers.
4. In Cloudflare Pages → Custom Domains → add your apex domain + `www.yourdomain.com`.
5. Cloudflare auto-creates the DNS records and provisions HTTPS.

Propagation takes a few minutes to a few hours.

**Path B — Keep DNS at GoDaddy:**

1. In Cloudflare Pages → Custom Domains → add `www.yourdomain.com` → note the CNAME target (`your-project.pages.dev`).
2. In GoDaddy DNS: add `CNAME www → your-project.pages.dev`.
3. For the apex (`yourdomain.com`): GoDaddy doesn't support CNAME flattening, so either:
   - Forward the apex to `www` via GoDaddy's forwarding feature, OR
   - Add A records pointing to Cloudflare's anycast IPs (listed at cloudflare.com/ips).

---

## Adding content

### Update text / copy
All content is authored directly in HTML. Each page's HTML is at:
- `index.html` — home
- `works/index.html` — works
- `about/index.html` — about
- `playground/index.html` — playground

### Update nav/footer links (social, email)
Search for `href="mailto:hello@example.com"` and `href="https://linkedin.com"` across all HTML files and replace.

### Add an image
1. Add the file to `src/assets/images/` (Vite will hash and optimize it).
2. Import it in the relevant page JS: `import heroImg from '../assets/images/hero.jpg'`
3. Use the imported URL in HTML via JS, or reference `/src/assets/images/foo.jpg` in dev (Vite resolves these paths).

For `<picture>` elements with AVIF/WebP fallback:
```html
<picture>
  <source srcset="/src/assets/images/hero.avif" type="image/avif" />
  <source srcset="/src/assets/images/hero.webp" type="image/webp" />
  <img src="/src/assets/images/hero.jpg" alt="..." width="1200" height="800" loading="lazy" />
</picture>
```

### Add a new page
1. Create `new-page/index.html` (copy an existing one, update title/description/links).
2. Add `newPage: resolve(import.meta.dirname, 'new-page/index.html')` to `vite.config.js` under `build.rollupOptions.input`.
3. Create `src/styles/pages/new-page.css` and `src/scripts/pages/new-page.js`.

---

## Design token updates (when Figma designs land)

All colors, typography, spacing, and easings are in `src/styles/tokens.css`.  
Replace the placeholder values with the actual values from the Figma file — everything else picks them up automatically.

---

## Project structure

```
portfolio/
├── index.html                 # Home
├── works/index.html           # Works
├── about/index.html           # About
├── playground/index.html      # Digital playground
├── 404.html
├── public/                    # Static assets (copied as-is to dist/)
│   ├── fonts/
│   └── og/
├── src/
│   ├── styles/
│   │   ├── tokens.css         # Design tokens (colors, type, spacing, easings)
│   │   ├── reset.css
│   │   ├── base.css           # Shared nav, footer, layout
│   │   └── pages/             # Per-page CSS
│   ├── scripts/
│   │   ├── lib/
│   │   │   ├── gsap-setup.js  # GSAP + plugins init
│   │   │   ├── lenis.js       # Smooth-scroll init
│   │   │   └── reveal.js      # Text + element reveal helpers
│   │   ├── components/
│   │   │   └── nav.js         # Nav active state + mobile toggle
│   │   └── pages/             # Per-page entry scripts
│   │       ├── home.js
│   │       ├── works.js
│   │       ├── about.js
│   │       └── playground.js  # Lazy-loads Three.js on scroll
│   └── assets/
│       ├── images/
│       └── video/
├── vite.config.js
└── package.json
```
