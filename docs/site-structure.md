# siddsingh.dev — Site structure

## Design direction

| Reference                                      | What we take from it                                                                                       |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| [chanhdai.com](https://chanhdai.com)           | **Overall craft** (framed column, hairlines, panels). Our own identity on top: see [design.md](design.md). |
| [joshwcomeau.com](https://www.joshwcomeau.com) | Blog reading experience; interactive tools living on the main domain.                                      |
| [marclou.com](https://marclou.com)             | Products shown as a card grid with a pitch and a live status/metric.                                       |
| [it-tools.tech](https://it-tools.tech)         | Tool ideas, and the categorised-hub-with-search pattern. Not a visual reference.                           |

The full visual spec (tokens, frame system, components, page templates and how we differ from chanhdai.com) lives in [design.md](design.md).

## Sitemap

v1 URLs are kept so existing links and search rankings carry over.

| Route           | Audience                     | Content                                                                                                                                                                                                                                                        | Reference                                              |
| --------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `/`             | Recruiters and clients first | Pitch hero (availability, headline, Hire me / View resume), profile + Fig. 1, proof strip, overview, then: selected work, services, products, experience, tools, contact. Each preview links to its page. Order in [design.md §7](design.md#7-page-templates). | chanhdai craft, hiring-first content                   |
| `/about`        | Recruiters                   | Resume: summary, experience timeline, education, skills/stack, "Download PDF".                                                                                                                                                                                 | chanhdai Experience/Education sections                 |
| `/work`         | Freelance clients            | "Available for work" status, services, selected client projects table (project / type / client / year), process, testimonials, contact CTA.                                                                                                                    | Olivier Larose-style project table in chanhdai's frame |
| `/work/[slug]`  | Freelance clients            | Case study: problem → what I did → result, with screenshots and stack.                                                                                                                                                                                         | —                                                      |
| `/products`     | Users, everyone              | Card grid. Each card: icon, one-line pitch, status (Live / Beta / Waitlist), a metric when there is one (users, stars, MRR), link to its subdomain.                                                                                                            | marclou                                                |
| `/blog`         | Readers                      | Searchable post grid with cover images, plus tags.                                                                                                                                                                                                             | chanhdai /blog, joshwcomeau                            |
| `/blog/[slug]`  | Readers                      | Article page: table of contents, code blocks, interactive embeds, related posts, newsletter/subscribe CTA.                                                                                                                                                     | joshwcomeau                                            |
| `/tools`        | Search traffic               | Tools hub: categories, search, card grid.                                                                                                                                                                                                                      | it-tools                                               |
| `/tools/[slug]` | Search traffic               | One tool per page with its own metadata and OG image, a short "how it works", and a soft CTA ("built by Sidd — start a project / see products").                                                                                                               | joshwcomeau gradient generator                         |

**System routes:** `/rss.xml` (redirect v1's `/api/rss`), `/sitemap.xml`, `/robots.txt`, `/llms.txt`, Markdown versions of pages, dynamic OG images per page, a custom 404. Details in [SEO and AEO](#seo-and-aeo).

**Shared chrome:** header (logo, Work, Products, Blog, Tools, About, ⌘K, theme toggle), colophon footer, command palette that searches posts, tools, products and pages.

## Products on subdomains

- Each product is its own app: `apps/<product>` → its own Vercel project on `<product>.siddsingh.dev`. When it outgrows the subdomain, add its new domain to that Vercel project and redirect the subdomain to it.
- Every product app uses `@workspace/ui` so it shares the site's look.
- The `/products` page reads a typed list of products in `apps/web`, so a product is listed there before, during and after its move to its own domain.
- Candidates from v1: Plenz, admin-boil CLI, MCP multi-server client (currently written up as work in `main`). Decide which are products and which are case studies.

## Content model (inside `apps/web`)

| Content      | Format                             | Notes                                                                                                                          |
| ------------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Blog posts   | MDX in `apps/web/content/blog/`    | Fresh start: v1's posts are not ported. Each file exports `metadata` (title, summary, date, updated, tags); see `lib/blog.ts`. |
| Case studies | MDX in `content/work/`             | Port v1's 3 project write-ups where they are client work.                                                                      |
| Products     | Typed TS data (`data/products.ts`) | name, slug, pitch, status, url, icon, metric.                                                                                  |
| Tools        | Typed registry (`data/tools.ts`)   | slug, name, category, description, keywords, how-to steps, FAQ; component loaded lazily per tool.                              |
| Resume       | Typed TS data (`data/resume.ts`)   | One source for `/about`, the home preview and the PDF.                                                                         |

Code layout follows the app router: route files in `app/`, page-specific UI next to the route, shared site UI in `components/`, and each tool in `features/tools/<slug>/` so tools stay isolated and lazily loaded. Generic UI goes to `packages/ui`. SEO helpers live in one place in `apps/web/lib/seo/`: site config (name, URL, socials), a metadata builder, and JSON-LD builders for each schema type, so every page uses the same `Person` and URLs.

## SEO and AEO

AEO (answer engine optimisation) means being found and quoted by AI answer engines: ChatGPT search, Perplexity, Google AI Overviews, Claude. Only the items below affect the structure; copywriting and keyword research come later.

### Site-wide

- **One canonical host:** `siddsingh.dev`. Redirect `www.` to it and pick one trailing-slash rule. Every page sets a canonical URL through `metadataBase` + `alternates.canonical`.
- **Keep v1 URLs** (see Sitemap) and 301-redirect the ones that change, such as `/api/rss` → `/rss.xml`.
- **Static by default:** posts, case studies, tool pages and product listings are statically generated (`generateStaticParams`), so crawlers get full HTML and Core Web Vitals stay good.
- **Breadcrumbs** on every nested page (`Blog › Post`, `Tools › JSON formatter`), shown visually and in JSON-LD.
- **Search Console:** add `siddsingh.dev` as a Domain property so every product subdomain is covered from one place.

### Structured data (JSON-LD) per page type

| Page            | Schema.org type                                                            |
| --------------- | -------------------------------------------------------------------------- |
| `/`             | `WebSite` + `Person` (name, role, `sameAs` links to GitHub, X, LinkedIn)   |
| `/about`        | `ProfilePage` with the same `Person`                                       |
| `/work`         | `ProfessionalService` (services offered, area served, contact)             |
| `/work/[slug]`  | `CreativeWork`                                                             |
| `/blog/[slug]`  | `BlogPosting` (author → the `Person`, published and modified dates, image) |
| `/tools/[slug]` | `WebApplication` (free, category, browser-based)                           |
| `/products`     | `ItemList` of `SoftwareApplication`                                        |
| Nested pages    | `BreadcrumbList`                                                           |

One `Person` entity is reused everywhere (same `@id`), so search engines and answer engines tie every page back to you.

### Content shape that answer engines can quote

- **Posts:** a one-paragraph summary at the top (from frontmatter `summary`), question-style H2s where natural, visible author and "last updated" date.
- **Tool pages:** the tool UI is a client component, but the page around it is server-rendered text: what the tool does, how to use it in steps, and a short FAQ. (Google now shows FAQ rich results only for a few authoritative sites, so the FAQ is there for readers and answer engines, not for rich results.)
- **Products and services:** state plainly what it is, who it is for and what it costs, so answers can quote it.

### Machine-readable endpoints

- `/sitemap.xml` (generated from content and the tool registry), `/robots.txt`, `/rss.xml`.
- `/llms.txt`: a curated index of the site with one-line descriptions and links, as chanhdai.com has.
- **Markdown versions of pages** (e.g. `/blog/<slug>.md`), linked from `llms.txt`, so AI tools can read clean text. Implemented as a route handler plus a rewrite; it reuses the MDX source.
- **AI crawler policy** in `robots.txt`: allow search/answer bots (OAI-SearchBot, PerplexityBot, Claude-SearchBot); decide separately whether to allow training crawlers (GPTBot, ClaudeBot, Google-Extended).
- **OG images:** one generated image per page via `opengraph-image.tsx` per route segment.

### Subdomains

Each product app has its own `sitemap.xml`, `robots.txt`, metadata and JSON-LD. Search engines treat it as a separate site, so it links back to `siddsingh.dev` ("by Siddhant Singh") and is listed on `/products`. That keeps authority flowing between the two.

## Tools: first picks

Start with the tools that already exist or bring search traffic, then add from the it-tools list.

1. **Screenshot mockup**: port from v1 (`src/features/tools/screenshot-mockup` on `main`).
2. **OG / meta tag previewer**: v1 already has the OG fetch/proxy routes.
3. Quick wins from it-tools: JSON formatter ↔ YAML/TOML, JWT decoder, colour converter, Base64, UUID/ULID, cron expression explainer, regex tester.

## Build order

1. **Design + SEO foundation**: theme tokens, fonts, the framed layout, header, footer, ⌘K shell; site config, metadata builder, JSON-LD helpers, `robots.txt`, `sitemap.xml`, `www` and v1 redirects.
2. **Home + About**: the pages recruiters see first.
3. **Blog**: MDX pipeline (done, no posts yet), then RSS and OG images.
4. **Work**: services page and case studies.
5. **Tools**: hub, then port screenshot mockup, then new tools one at a time.
6. **Products**: page and data; the first product app when one is ready.

## Open decisions

- Which v1 projects are products versus freelance case studies.
- Whether `/work` shows pricing or a "starting at" range.
- Newsletter provider, if any (Josh and Marc both use their content to grow a list).
- Whether to allow AI training crawlers, separately from AI search crawlers (see SEO and AEO).
