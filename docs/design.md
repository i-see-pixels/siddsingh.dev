# siddsingh.dev — Design spec

The visual system for the site. It borrows chanhdai.com's **craft**: the framed column, hairlines, panels and polish. It does not borrow its **identity**. Ours is a drafting-table blueprint: ink-blue and paper colours, one drafting-blue accent, sheet-numbered sections, and a site built to get you hired. [Section 2](#2-identity-how-we-differ-from-chanhdaicom) lists every difference.

**Research (2026-10-16):** read chanhdai.com's source ([ncdai/chanhdai.com](https://github.com/ncdai/chanhdai.com), MIT): `styles/globals.css`, `features/portfolio/components/{panel,profile-header,overview,blog,experiences,projects}`, `components/{site-header,nav,page-heading,site-footer-cad,site-bottom-nav,theme-toggle,ui/icon-tile}.tsx`, `lib/fonts.ts`. Then measured the live site and compared it with our first build.

**Licence:** MIT, so we can adapt patterns and utilities. Credit chanhdai.com in the footer's "Inspired by" list. Never reuse its brand assets: the CD mark, the isometric logo drawing, avatars, copy or the interactive logotype.

---

## 1. Principles

1. **A drawing on a drafting table.** Content sits in one column framed by hairlines; horizontal lines run edge to edge; empty bands are hatched; figures are labelled; every section is a numbered sheet.
2. **Ink and paper, one blue pen.** Blue-tinted neutrals (slate), warm paper in light mode, blueprint ink in dark mode, and **one accent: drafting blue**, used for what matters (hire actions, availability, figure linework, focus).
3. **Built to get hired.** Every page answers a recruiter's or client's question within one screen: who you are, what you do, proof that you can do it, and how to contact you.
4. **Two voices of type.** Geist Sans for reading, Geist Mono for facts. Architects Daughter (handwriting) for margin notes only.
5. **Quiet until touched.** Hover reveals: tints, greyscale-to-colour images, copy-link icons, highlighted figure parts.

---

## 2. Identity: how we differ from chanhdai.com

| Area | chanhdai.com | siddsingh.dev |
|---|---|---|
| **Palette** | Pure zinc greys, black/white | Slate (blue-tinted) neutrals; **light = drafting paper** (warm off-white), **dark = blueprint ink** (deep blue-black); hairlines tinted blue |
| **Accent** | None (monochrome) | **Drafting blue** for the Hire CTA, availability, figure strokes, links, focus ring, selection |
| **Default mode** | Dark-leaning | **Light (paper) by default**; dark (ink) via toggle or system setting |
| **Hero** | Name + avatar + isometric logo | **Value proposition first**: headline, availability, two CTAs, then the blueprint figure of your world |
| **Section headings** | "Blog⁽¹⁴⁾" | Sheet numbers: `01` label + title, e.g. `01 — Selected work`, plus the count |
| **Frame details** | Plain line intersections | **Registration marks** (small `+` crosshairs) where panel lines meet the column edges; dimension lines on the figure |
| **Header actions** | Search, GitHub stars, theme | Search, theme, **availability dot**, and a **"Book a call" button** (cal.com; "Join the waitlist" when booked) (the only filled accent button on the site) |
| **Home content** | Components, blocks, sponsors, testimonials | **Proof → work → services → products → experience → tools → contact** |
| **Annotations** | Caveat font | **Architects Daughter**, in drafting blue |
| **Footer** | CAD title block | Title block too, plus a **"Hire" field** and a contact CTA row above it |
| **Brand mark** | Blocky "CD" pixels | **`sidd▪` wordmark**: "sidd" in Geist Mono ending in a drafting-blue cursor block |

---

## 3. Tokens

### Colour

Neutrals use Tailwind's **slate** scale (blue-tinted). Light mode uses warm paper instead of pure white.

| Token | Light (paper) | Dark (ink) | Use |
|---|---|---|---|
| `--background` | paper `oklch(0.985 0.004 95)` | ink `oklch(0.16 0.025 262)` | Page |
| `--foreground` | slate-950 `oklch(0.129 0.042 264.695)` | slate-50 `oklch(0.984 0.003 247.858)` | Text |
| `--muted` / `--secondary` / `--accent` | slate-100 `oklch(0.968 0.007 247.896)` | slate-800 `oklch(0.279 0.041 260.031)` | Fills |
| `--muted-foreground` | slate-500 `oklch(0.554 0.046 257.417)` | slate-400 `oklch(0.704 0.04 256.788)` | Secondary text |
| `--card` / `--popover` / `--surface` | white `oklch(1 0 0)` | slate-900 `oklch(0.208 0.042 265.755)` | Raised surfaces, code blocks |
| `--border` | slate-200 `oklch(0.929 0.013 255.508)` | slate-800 | Component borders, panel bottoms |
| `--line` | `color-mix(in oklab, var(--border) 64%, var(--background))` | same formula | Frame hairlines |
| `--accent-muted` | accent at 50% | accent at 20% | Hover tint on rows and cards |
| **`--brand`** | blue-600 `oklch(0.546 0.245 262.881)` | blue-400 `oklch(0.707 0.165 254.624)` | Drafting blue: Hire CTA, figure strokes, annotations, links |
| `--brand-foreground` | white | slate-950 | Text on brand |
| `--brand-muted` | brand at 10% | brand at 15% | Availability pill background, figure fills |
| `--primary` | slate-950 | slate-50 | Neutral filled buttons |
| `--ring` | `--brand` at 50% | `--brand` at 50% | Focus |
| `--success` | green-600 `oklch(0.627 0.194 149.214)` | green-500 `oklch(0.723 0.219 149.579)` | "Available" dot, product status "Live" |
| `--info` | sky-500 `oklch(0.685 0.169 237.323)` | same | "New" post dot, status "Beta" |
| `--selection` | brand on brand-foreground | same | Selected text |

Rules:
- **Frame = `--line`, components = `--border`, actions = `--brand`.**
- `--brand` appears at most **once per screen as a filled surface** (the Hire button or the hero CTA). Everywhere else it is a stroke, text or dot.
- Check contrast: `--muted-foreground` on paper and ink must stay ≥ 4.5:1 for body text.

### Typography

| Font | Variable | Use |
|---|---|---|
| Geist Sans | `--font-sans` | Default |
| Geist Mono | `--font-mono` | Facts, labels, sheet numbers, footer, tags. Features `ss11`, `zero`, `tnum`. |
| **Architects Daughter** (Google Fonts, 400) | `--font-handwritten` | Margin annotations in `--brand` with hand-drawn arrows. `lg+` only. |

No serif face until we have testimonials. Body: `antialiased`, `font-synthesis-weight: none`, `text-rendering: optimizeLegibility`.

| Role | Style |
|---|---|
| Hero headline (h1) | `text-4xl sm:text-5xl font-medium tracking-tight text-balance` |
| Name line | `text-[2rem]/none font-medium tracking-tight` (under the headline on the home page; it is the h1 on `/about`) |
| Page title (h1) | `text-4xl font-medium tracking-tight text-balance` |
| Section title (h2) | `text-3xl font-medium tracking-tight text-balance`, preceded by the sheet number |
| Sheet number | `font-mono text-sm text-muted-foreground tabular-nums` → `01` |
| Section count | `<sup>` `top-[-0.75em] ml-1 text-sm font-medium tracking-normal text-muted-foreground` |
| Item title (h3) | `text-lg/snug font-medium text-balance`; experience company `text-xl/6` |
| Page tagline | `text-sm/none font-medium tracking-wider text-muted-foreground` |
| Body / description | `text-base text-muted-foreground text-balance`; long descriptions 15px / 1.6 |
| Metric value | `font-mono text-3xl font-medium tabular-nums tracking-tight` |
| Meta | `text-sm text-muted-foreground tabular-nums` |
| Field label | `font-mono text-[0.625rem]/4 font-medium uppercase tracking-wider text-muted-foreground` |
| Nav link | `text-sm font-medium tracking-wide text-muted-foreground`; current page `text-foreground` |
| Figure caption | `text-sm/none tracking-wide tabular-nums`, muted-foreground mixed 60% with background |
| Annotation | `font-handwritten text-base text-brand -rotate-6` |

### Layout and spacing

| Token | Value |
|---|---|
| Column | `md:max-w-3xl` (768px), centred |
| Gutter | `px-2` on header, main and footer wrappers; `max-w-screen overflow-x-clip` |
| Header | `--header-height: 3.5rem`, sticky |
| Panel padding | `p-4` content, `px-4` headers |
| Separator band | `--separator-height: 2rem`; footer top band `h-12` |
| Radius | shadcn `--radius` 0.625rem; cards/images `rounded-xl`; icon tiles `rounded-md`; tags and pills `rounded-full` |
| Anchors | `[id] { scroll-mt-18 }` |
| Scrollbar | 5px, thumb `--border`, transparent track |

---

## 4. The frame system

Utilities in `packages/ui/src/styles/globals.css` (adapted from chanhdai):

| Utility | Draws |
|---|---|
| `screen-line-top` / `screen-line-bottom` | 1px `--line` rule, 200vw wide, behind content, at the element's top/bottom edge |
| `screen-line-{top,bottom}-{color}` | Same, other colour (e.g. `-border` for panel bottoms) |
| `screen-line-{top,bottom}-none` | Removes a line that would double up |
| `screen-dashed-line-{top,bottom}` | Dashed variant (4px dash, 6px period) |
| `diagonal-stripes` | 315° stripes, 10px tiles, `--line` at 56% |
| `stripe-divider` | `h-8` band whose stripes span the full screen width |
| `dot-grid` | 8px dot pattern at 5% foreground, for figure backgrounds |
| **`registration-marks`** (ours) | Small `+` crosshairs (9px, `--line`, `bg-background`) at an element's top-left and top-right corners, sitting on the column edges |
| `link` / `link-underline` | Hover underline / faint underline that strengthens on hover |
| `extend-touch-target` | 8px extra hit area on coarse pointers |

**Structure:**
- The page column (`mx-auto md:max-w-3xl border-x border-line`) draws the vertical edges once.
- Each section is a `Panel`: top line `--line`, bottom line `--border`, registration marks on its top corners.
- Between panels: `Separator` = `stripe-divider h-(--separator-height) w-full border-x`.
- Inner dividers use `border-line`, solid or dashed.

---

## 5. Components

### Header
- `sticky top-0 z-50 bg-background px-2`; bar `h-14 border-x screen-line-top screen-line-bottom md:max-w-3xl pl-4 pr-2`.
- Left: **`sidd▪` wordmark** (`text-xl`), links home.
- Spacer, then on the right: nav (`Work · Products · Blog · Tools · About`) → `|` → search trigger (ghost: icon + `Ctrl` `K`) → `|` → theme toggle → **Book a call** (`size-sm`, `bg-brand text-brand-foreground`, with a `--success` dot when available).
- Vertical separators: `h-5`, `--line`.
- `< sm`: nav and search move to the bottom nav; the logo, theme toggle and Hire me stay.

### Mobile bottom nav
Floating pill at bottom centre: `rounded-xl bg-popover shadow-md ring-1 ring-foreground/10`, search trigger + nav menu, `env(safe-area-inset-bottom)` aware. A fixed bottom fade (`h-24`) under it.

### Hero (home)
Two stacked parts inside the frame:

1. **Pitch panel**
   - Availability pill: `rounded-full bg-brand-muted text-brand font-mono text-xs` with a pulsing `--success` dot. Text: "Available for freelance · Open to full-time roles". Driven by one config value; hidden when unavailable.
   - Headline (h1): what you do and for whom, in one sentence (copy TBD; e.g. "I build fast, polished web products for teams and founders.").
   - One-line support text (muted).
   - CTAs: **Book a 15-min call** (brand, filled) → cal.com link; **See my work** (outline) → `/work`; small text link "or email me" → prefilled mailto.
   - Annotation in the left gutter on `lg+`: "← start here" in Architects Daughter.
2. **Profile row + Fig. 1**
   - Grid: avatar (bottom left, overlapping the figure edge) | name line with **social icon buttons** (GitHub, LinkedIn, email; outline `icon-sm`, tooltips) and a handwritten "← follow me" in `--brand` | mono flip sentence.
   - Bullet-joined text ("A · B") uses `Joined`: the bullet is glued to the previous word with a non-breaking space and hyphenated words never split, so phones never start a line with "·".
   - **Fig. 1 — exploded isometric drawing** (`components/home/blueprint-figure.tsx`): three plates pulled apart vertically — design system (`packages/ui`), web app (`siddsingh.dev`), content (Work, Tools, Blog blocks plus a dashed empty slot for what is next) — with product subdomains floating beside the web layer. Dashed guides join the plate corners. Strokes `--brand`, side faces tinted with brand at 7% / 14%, callout leaders `--muted-foreground`, background `dot-grid`. **Callouts carry live counts** from the content sources (case studies, tools, posts, products), the installed Next.js version and the number of UI components. Callout leaders start at a **corner** of the shape and climb along the 30° isometric slope to a short horizontal shelf between the title and its count. **Build-up animation (~3s, `--expo-out`):** the three plates draw in as one solid block, split apart vertically, the page blocks rise out of the top plate (clipped at its surface), the product blocks slide out of the stack, then guides, plate labels and callouts fade in. Hovering a block or product lifts it 4px and links to its section. Phones hide the callouts, re-fit the drawing to the centre, and show the same counts as a two-column legend below. Reduced motion: no animation. Caption "Fig. 1." bottom right.

### Avatar
Real photo, round, `size-30 sm:size-40`, greyscale → colour on hover (300ms), 1px inset ring (`foreground/30` light, `/10` dark).

### Proof strip (new)
Right after the hero: a 4-cell `gap-px bg-line` grid (2 columns on mobile), each cell a **metric value** + field label: years of experience, projects shipped, products launched, users or stars. Optional second row: client or employer logos in greyscale, colour on hover. Only real numbers; hide a cell rather than inflate it.

### Overview
Panel without a visible title: `grid sm:grid-cols-2 gap-x-4 gap-y-2.5` of **IconTile + mono text** rows: role @ company, location (maps link), local time with offset to the visitor ("// 5h 30m ahead"), email (revealed on click), availability. Dashed `--line` divider down the middle on `sm+`.

### Section heading (Panel header)
`01` sheet number (mono, muted) on its own line or inline before the title, then the title, count sup, and a copy-link icon on hover. Example: `02  Selected work⁽³⁾`.

### Panel
| Part | Classes |
|---|---|
| `Panel` | `screen-line-top screen-line-bottom screen-line-bottom-border registration-marks` + `id` |
| `PanelHeader` | `screen-line-bottom px-4` |
| `PanelTitle` | h2 per the type table, anchor link, copy-link on hover |
| `PanelDescription` | `py-4 text-base text-balance text-muted-foreground` |
| `PanelContent` | `p-4` |
| `PanelFooter` | `screen-line-top flex justify-center py-4`, a `secondary sm` button ("All work →") |

### Case study card (Selected work)
Row-style card: cover image (greyscale → colour) on the left on `sm+`, then client · type · year (mono meta), title, **one outcome metric** in large mono ("-42% load time", "3× signups"), stack tags. Hover `bg-accent-muted`. Links to `/work/[slug]`.

### Service card (new)
Grid of 2–3: IconTile, service name, two-line description, "what you get" list (3 bullets), and **starting price or typical timeline** in mono ("from $X · 2–4 weeks"), if `/work` shows pricing (structure doc decision). Ends with the Hire CTA.

### Product card (marclou-style)
IconTile with the product icon, name, one-line pitch, **status tag** (Live `--success` / Beta `--info` / Waitlist muted), optional metric (users, MRR, stars) with a tiny sparkline, link to the subdomain. Two-column card grid.

### Tool card (it-tools-style)
IconTile + name + one-line description + category tag. `/tools` adds category chips and a search input above the grid.

### Post card
`p-2`, hover `bg-accent-muted`; cover `aspect-1200/630 rounded-xl` greyscale → colour, inset ring; title `text-lg/snug`; date `d MMM yyyy`; `--info` dot for new posts. Whole card clickable.

### Experience timeline (`/about`, short version on home)
Company row (logo greyscale → colour, name, location, pulsing dot for the current employer), positions joined by a vertical `--border` line with a rounded elbow; each position: IconTile, title, `type | period | duration`, collapsible description, skill tags. On `/about`, add **Download PDF** (outline) and a print stylesheet.

### Contact panel (new)
Last section on home and `/work`: `id="contact"`. Headline ("Let's build something"), availability pill, response-time promise ("Replies within 24 hours"), timezone, then actions: **email** (copy button + mailto), **book a call** (calendar link), and links to LinkedIn and GitHub. A short form can come later.

### Testimonials (when available)
Quote cards with name, role, company and avatar. Use a serif face for quotes only if we add testimonials.

### IconTile, Tag, Page heading
- IconTile: `size-6 rounded-md border border-muted-foreground/15 bg-muted text-muted-foreground ring-1 ring-border/50 ring-offset-1 ring-offset-background dark:ring-line`, icon `size-4`.
- Tag: `rounded-full border bg-muted/50 px-1.5 py-0.5 font-mono text-xs text-muted-foreground`.
- Page heading: tagline → title between screen lines (`text-4xl`) → optional description; `pt-12` of empty frame above.

### Footer (title block)
1. Contact CTA row: "Have a project in mind?" + **Start a project** button (mailto) + email.
2. `stripe-divider h-12` band.
3. Title row: `siddsingh.dev` (mono) left, one-line description right.
4. Field grid `grid-cols-2 md:grid-cols-4 gap-px bg-line`: **Hire** (availability + link), Built by, Build (SHA → commit, "(local)" outside production), Date, Stack, Typeface, Source, For agents (`llms.txt`), Inspired by (`01 chanhdai.com`, `02 Josh W. Comeau`, `03 Marc Lou`…).
5. Bottom bar: wordmark (`text-sm`) left, social icons separated by short vertical lines.

### Theme toggle
Half-filled circle icon that rotates 180° over 500ms (`motion-safe`), tooltip "Toggle mode `D`", `D` hotkey, updates `meta[name=theme-color]`. **No sound.**

### Command menu
`⌘K`/`Ctrl K`. Groups: Pages, Work, Posts, Tools, Products, Links ("Email me", "Download resume", "Book a call"), Theme.

---

## 6. Motion and interaction

- Hovers: `transition-[color]` / `transition-[background-color] ease-out`, tint `bg-accent-muted`.
- Images greyscale → colour on hover (300ms, `cubic-bezier(0.42,0,0.58,1)`).
- Buttons `active:scale-[0.98]`.
- Availability dot: gentle `animate-ping` at 50% opacity.
- Figure: hover highlights only; on first view, strokes draw in once (`stroke-dashoffset`, 800ms, `--expo-out`).
- Respect `prefers-reduced-motion` everywhere; larger hit areas on coarse pointers.

---

## 7. Page templates

| Page | Sections (in order) |
|---|---|
| `/` | Pitch hero → Profile row + Fig. 1 → Proof strip → Overview → `01` Selected work (3 case studies) → `02` Services → `03` Products → `04` Experience (current + one previous) → `05` Tools (4 featured) → Contact |
| `/about` | Page heading + Download PDF → Overview → Experience (full) → Education → Skills/stack → Contact |
| `/work` | Page heading + availability → Services → Selected work (all) → Process (4 numbered steps) → Testimonials → Contact |
| `/work/[slug]` | Heading (client, type, year) → outcome metrics strip → problem → what I did → result → stack → next case study → Contact |
| `/products` | Page heading → product card grid → "Want to follow launches?" newsletter row |
| `/blog` | Page heading → search → post card grid |
| `/blog/[slug]` | Article (prose, TOC in the margin on `xl`) → related posts → Hire/subscribe CTA |
| `/tools` | Page heading → category chips + search → tool card grid |
| `/tools/[slug]` | Tool UI → how it works → FAQ → "Built by Sidd — need a custom tool? Hire me" CTA |

---

## 8. Decisions

| Decision | Choice |
|---|---|
| Hero figure | **Exploded isometric drawing** of the site (Fig. 1) with live-count callouts and a draw-in animation. |
| Brand mark | **`sidd▪` wordmark** (mark E): mono "sidd" + a blue cursor block, sized by font size (`components/brand-mark.tsx`). Favicon: a geometric "s" + blue block on slate-900 (`app/icon.svg`). `siddsingh.dev` text in the footer title row. |
| Handwritten font | **Architects Daughter**, annotations only, in `--brand`. |
| Avatar | **Real photo**, greyscale → colour on hover. |
| Theme toggle sound | **None.** |
| Identity | Slate + paper/ink palette, drafting-blue accent, sheet numbers, registration marks, hiring-first layout ([section 2](#2-identity-how-we-differ-from-chanhdaicom)). |

**Still to supply (content, not design):** headline copy, real proof metrics, case studies, services and pricing stance, photo, calendar link, email.

---

## 9. Gap list: current build → this spec

1. **Tokens:** switch zinc → slate, light background to paper, dark to ink; add `--line`, `--brand` (+ foreground, muted), `--accent-muted`, `--surface`, `--success`, `--info`, `--selection`.
2. **Lines:** frame lines use `--line`; panel bottoms `--border`; adopt the colour, `-none` and dashed variants; add `registration-marks`.
3. **Stripes:** replace `bg-hatch` with `diagonal-stripes` / `stripe-divider` (315°, 10px, 56%, full width).
4. **Header:** nav right-aligned; ghost search trigger with kbds only; separators; Hire me button with availability dot; `sidd▪` wordmark; top screen line.
5. **Hero:** pitch panel (availability pill, headline, CTAs) + profile row with avatar and Fig. 1 placeholder.
6. **Proof strip and overview:** metric grid; overview as IconTile + mono two-column grid with dashed divider.
7. **Panels:** sheet numbers, sans count sup, `PanelDescription`, `PanelFooter` button, copy-link on hover.
8. **New components:** case study card, service card, product card, tool card, contact panel.
9. **Footer:** CTA row, stripe band, `gap-px bg-line` 4-column field grid with 10px labels, Hire field, bottom bar.
10. **Mobile:** floating bottom nav and bottom fade.
11. **Globals:** antialiasing, font synthesis off, mono font features, brand selection, thin scrollbar, `scroll-mt`; load Architects Daughter.
12. **Theme toggle:** rotating half-circle icon with tooltip; default theme **light**.
