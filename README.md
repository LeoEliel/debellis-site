# De Bellis – Assistência Técnica & TI · Landing page

Single-page, mobile-first landing page for **Fabio De Bellis**, computer technician
serving **Ariquemes – RO** and the **Vale do Jamari**. One goal: open a WhatsApp chat.

Ported from the Claude Design prototype (project `14ea3e03-fa9b-4a3a-b69e-78ddc3a6c825`)
to plain HTML/CSS/JS — no build step, no dependencies.

## Run it

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

Deploys as-is to GitHub Pages, Netlify, Vercel, or any host that serves static files.

## Files

| Path | What it is |
|---|---|
| `index.html` | The whole page: 9 sections, all copy, inline SVG icon sprite |
| `styles.css` | Tokens (`:root`), components, sections, hardware stand-ins, reduced-motion rules |
| `main.js` | Motion engine: one rAF scroll loop + one IntersectionObserver, tilt, FAQ, analytics hook |
| `assets/qr.svg` | Real QR code for `wa.me/5511997348146` (generated, not a placeholder) |
| `design-reference/` | The original prototype, kept for reference. **Not shipped** — don't edit it |

## Before launch — required

### 1. Replace the three placeholder images in `assets/`

The originals could not be pulled from the design project (the export tool caps file
reads at 256 KiB and the PNGs exceed it), so **these are stand-ins, not the real brand
assets**:

| File | Current placeholder | Replace with |
|---|---|---|
| `logo.png` | Generated wordmark: silver "DE" + blue "BELLIS", DejaVu Bold | The real De Bellis wordmark with the silver "B" swoosh |
| `mark.png` | Generated rounded blue "B" tile | The real "B" mark |
| `tower.png` | Unsplash photo of a blue-lit PC case, background keyed to alpha | A proper 3D render of the tower |

The originals in the design project were cropped from the print flyer and are low-res —
**get the vector original from the client** rather than re-exporting those. The design
brief also asks for laptop, SSD, RAM, router and cable renders.

`tower.png` is [this Unsplash photo](https://unsplash.com/photos/e229f172b9d7), cropped
to portrait with its dark background keyed out and a feathered vignette so it dissolves
into the page. Unsplash licenses free commercial use without attribution, but swap it
for a real render before launch regardless.

If any of these files is ever missing, `main.js` detects the failed logo load and
switches to typographic/CSS fallbacks instead of showing broken images.

### 2. Replace the placeholder content

- **Testimonials (section 06)** — the three reviews are prototype copy, **not real
  customers**. Replace with real reviews (with permission) or delete the section.
- **Before/after photos (section 06)** — four striped placeholders await real photos.

### 3. Confirm with the client

The design handoff flagged these as assumptions:

- **The phone number is a (11) São Paulo number for a Rondônia business.** Verify it's
  intentional — it appears in the header, hero CTA, every service link, the contact
  section, the footer, the referral message and the QR code.
- Warranty period, typical turnaround, payment methods, business hours (FAQ items
  3–5 are marked `TODO(cliente)` in `index.html`).

## Design system

Tokens live in `:root` in `styles.css` and follow the handoff spec exactly.

- **Colors** — bg `#050B18` / `#0A1428`; blues `#1E6BFF` `#4FA3FF` `#8CC4FF` `#A9D3FF`;
  trace cyan `#5CE1FF`; ink `#F2F6FC` → `#5E6F8C`. Green (`#25D366`,
  `#34E27E → #1FBF5B`) is **reserved for WhatsApp actions only**.
- **Type** — Barlow Condensed (display), Barlow (body), JetBrains Mono (eyebrows/meta),
  all from Google Fonts.
- **Layout** — content max-width 1160px, gutters `clamp(28px, 5vw, 64px)`, section
  padding `clamp(64px, 10vw, 140px)`. The prototype's `cqw` units became `vw`.
- **Motion** — easing `cubic-bezier(.2,.7,.2,1)` (out) and `cubic-bezier(.7,0,.2,1)`
  (draw); micro 200ms, UI 350–500ms, reveal 900ms, draw 1200ms.

The hardware objects (RAM, SSD, fan, router, RJ45, rack) are **CSS stand-ins**, matching
the prototype. Swap in real 3D renders when available, keeping the same positions and
`data-k` / `data-mouse` parallax values.

## How the motion works

`main.js` runs one rAF-throttled scroll handler and one IntersectionObserver.

- **Parallax** — every `[data-k]` layer gets `translate` from its distance to the
  viewport centre (`k`, clamped ±220px) plus pointer offset (`data-mouse`, in px).
- **Trace spine** — `--p` on `:root` scales the glowing fill and positions the head dot.
- **Reveals** — `[data-reveal]` in `up` / `blur` / `x` / `node` flavors, staggered by
  `data-delay`. The hidden state is set **in JS on mount**, so content stays visible
  without JS.
- **Steps scrub** — `--s` on `#steps` drives the connector fill and lights nodes at
  2% / 46% / 90%.
- **Card tilt** — `[data-tilt]` gets a cursor-tracked 3D rotation and a spotlight overlay.
- **Reduced motion** — `prefers-reduced-motion: reduce` stops all loops, renders reveals
  final, draws the trace and lights every step, and keeps hover spotlight/icon glow.

## Analytics

Every WhatsApp link carries `data-cta="<location>"` (header / hero / servico / redes /
indicacao / contato / sticky). `main.js` pushes a `whatsapp_click` event to `gtag` or
`dataLayer` if either exists, and no-ops otherwise.
