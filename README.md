<div align="center">

<a href="https://siddsingh.dev">
  <img src="apps/web/app/icon.svg" alt="siddsingh.dev logo" width="88" height="88" />
</a>

<h1>siddsingh.dev</h1>

<p><strong>Portfolio, blog and free developer tools: built in the open.</strong></p>

<p>
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white" alt="Next.js 16" /></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white" alt="React 19" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white" alt="TypeScript 5" /></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" /></a>
  <a href="https://neon.tech"><img src="https://img.shields.io/badge/Neon-Postgres-00e599?logo=postgresql&logoColor=white" alt="Neon Postgres" /></a>
  <a href="https://orm.drizzle.team"><img src="https://img.shields.io/badge/Drizzle-ORM-c5f74f?logo=drizzle&logoColor=black" alt="Drizzle ORM" /></a>
  <a href="https://vercel.com"><img src="https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel&logoColor=white" alt="Deployed on Vercel" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License" /></a>
</p>

<p>
  <a href="https://siddsingh.dev"><strong>Website</strong></a> ·
  <a href="https://siddsingh.dev/blog">Blog</a> ·
  <a href="https://siddsingh.dev/tools">Tools</a> ·
  <a href="https://siddsingh.dev/work">Work</a> ·
  <a href="#make-it-your-own"><strong>Use it for your portfolio</strong></a> ·
  <a href="https://x.com/creatorsidd">X</a> ·
  <a href="https://www.linkedin.com/in/sidd-singh/">LinkedIn</a>
</p>

</div>

<br />

Source for [siddsingh.dev](https://siddsingh.dev): Siddhant Singh's portfolio, blog, products and free developer tools.

**Want a site like this?** Fork it and follow [Make it your own](#make-it-your-own). Your name, links, projects and resume live in two data files, and the blog, editor, SEO and tools come with it.

It is a pnpm + Turborepo monorepo with one Next.js 16 app. Posts live in Postgres and are written in a built-in Markdown editor at `/admin`. Public pages are served from cache, so the database is only queried again after a post changes.

## What's inside

| Route | What it is |
| --- | --- |
| `/` | Home: hero, selected work, services, contact |
| `/work`, `/products`, `/about` | Case studies, own products, experience |
| `/blog`, `/blog/[slug]` | Published posts, rendered from Markdown |
| `/tools`, `/tools/[slug]` | Free browser tools (see below) |
| `/admin` | Sign-in, post list and the post editor |
| `/blog/rss.xml`, `/sitemap.xml`, `/robots.txt`, `/llms.txt` | Feeds and crawler files |
| `/og/blog/[slug]` | Generated social card for posts without a cover |

**Tools:** screenshot mockup, LLM token & cost calculator, prompt template playground, tool schema converter (JSON Schema ↔ Anthropic / OpenAI), diff checker and Mermaid diagram previewer. They all run in the browser.

**Blog editor:** Markdown with a live preview, a formatting toolbar and shortcuts. You can paste or drop images to upload them to Vercel Blob. It also handles cover images, SEO title and description overrides, and drafts and publishing. Posts support GFM, code highlighting, Mermaid diagrams, callouts (`> [!NOTE]`), footnotes, and embeds from YouTube, Vimeo, Loom, CodePen, CodeSandbox and Spotify. To embed, paste the URL on a line of its own.

## Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **UI:** Tailwind CSS 4, shadcn/ui (Base UI) in `packages/ui`, lucide icons
- **Data:** Neon Postgres via Drizzle ORM (`packages/db`)
- **Auth:** Neon Auth (managed Better Auth), limited to a single admin account
- **Media:** Vercel Blob
- **Tooling:** Turborepo, pnpm workspaces, Biome for lint and format

## Repository layout

```
apps/web                 the site
  app/                   routes: (site) public pages, (admin) dashboard, (workspace) full-screen tools
  components/            shared UI: Markdown renderer, panels, cover image…
  features/              client features: blog-editor, tools
  modules/               domain logic by context (auth, blog, media), each split into
                         domain / application / infrastructure
  lib/                   env, auth session, cached blog read model, composition root
  proxy.ts               redirects signed-out visitors away from /admin
packages/db              Drizzle schema, client and SQL migrations
packages/ui              shadcn/ui components and global styles
packages/typescript-config
docs/                    design spec and site structure
```

`lib/server/container.ts` is the only place that wires concrete adapters (Drizzle, Neon Auth, Vercel Blob) to the use cases in `modules/`.

## Getting started

You need Node 24, pnpm, and a [Neon](https://neon.tech) project with Auth turned on.

```bash
pnpm install
```

Copy `apps/web/.env.example` to `apps/web/.env.local` and fill it in:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon pooled connection string; migrations read it too |
| `NEON_AUTH_BASE_URL` | Auth URL from Neon Console → Auth → Configuration |
| `NEON_AUTH_COOKIE_SECRET` | At least 32 characters (`openssl rand -base64 32`) |
| `ADMIN_EMAIL` | The only account allowed into `/admin` |
| `ADMIN_SETUP_ENABLED` | `true` opens `/admin/setup` once to create that account |
| `BLOB_STORE_ID`, `BLOB_READ_WRITE_TOKEN` | Vercel Blob store; needed for image uploads only |

Apply the database migrations, then start the dev server:

```bash
pnpm db:migrate
```

```bash
pnpm dev
```

The site runs at http://localhost:3000.

### Creating the admin account

1. Turn on email verification in Neon Console → Auth. Only a verified `ADMIN_EMAIL` counts as the admin.
2. Set `ADMIN_SETUP_ENABLED=true`, open `/admin/setup` and choose a password (12 characters or more).
3. Verify the address using the link Neon Auth emails you, then sign in at `/admin/login`.
4. Set `ADMIN_SETUP_ENABLED` back to `false`.

## Make it your own

The site is built so you can turn it into your own portfolio without touching the page components. Nearly everything personal is data.

### 1. Fork and run it

1. Fork this repository (or clone it and push to a new repo of your own).
2. Follow [Getting started](#getting-started): create a Neon project, fill in `apps/web/.env.local`, run `pnpm db:migrate` and `pnpm dev`.
3. Create your admin account (see [Creating the admin account](#creating-the-admin-account)) so you can write posts at `/admin`.

The blog starts empty. Your first post goes through the editor, not through files in the repo.

### 2. Replace the content

Two files hold almost everything a visitor reads:

| File | What to change |
| --- | --- |
| `apps/web/lib/site-config.ts` | `siteConfig` (name, domain, description, email, booking link, socials, location, time zone), `availability` (the "open for work" pill) and `navItems` |
| `apps/web/lib/content.ts` | Hero `pitch` and `proof` stats, `caseStudies` (/work), `services`, `products`, `experience`, `education`, `publication`, `certification`, `achievements`, `skills`, and `tools` (the /tools listing) |

Delete an entry you don't need, or leave an array empty. Images (avatar, hero, project tiles) are URLs, so they can be hosted anywhere. Allow that host in `apps/web/next.config.ts` → `images.remotePatterns` to get optimised images.

### 3. Swap the leftover personal bits

A few strings are hard-coded outside the data files. Search the repo for `siddsingh`, `creatorsidd`, `i-see-pixels` and `utxifjblgzbxujxp` to find them all:

| Where | What it is |
| --- | --- |
| `apps/web/app/icon.svg` | Favicon and logo |
| `apps/web/components/brand-mark.tsx` | The "sidd▪" wordmark in the header |
| `apps/web/components/home/hero.tsx` | Social handles shown in the hero |
| `apps/web/components/home/blueprint-figure.tsx` | Text in the home page illustration |
| `apps/web/components/site-footer.tsx`, `workspace-header.tsx`, `app/(admin)/…` | Domain name in the footer, headers and login page |
| `apps/web/app/layout.tsx` | `twitter.creator` handle |
| `apps/web/lib/content.ts` → `blobUrl`, `apps/web/next.config.ts`, `apps/web/lib/server/container.ts` | Vercel Blob store URL and upload folder (`siddsingh_dev`) |
| `apps/web/features/tools/screenshot-mockup/constants.ts` | Sample address in the mockup tool |

### 4. Restyle it (optional)

- **Colours:** the theme tokens are in `packages/ui/src/styles/globals.css`. Changing `--brand` in `:root` and `.dark` recolours links, accents and focus rings across the site.
- **Fonts:** loaded with `next/font` in `apps/web/app/layout.tsx`.
- **Pages:** each route is a small file under `apps/web/app/(site)/`. Remove a section from the nav by deleting it from `navItems` and its route folder.
- **Tools:** each tool is self-contained in `apps/web/features/tools/<slug>` and registered in `registry.tsx`. Drop the ones you don't want, together with their entries in `tools` in `content.ts`.

`docs/design.md` explains the design system (tokens, frame lines, panels) if you want to extend it in the same style.

### 5. Deploy

Import the repo into [Vercel](https://vercel.com/new), set the root directory to `apps/web`, add the environment variables and deploy. Add a Blob store from Vercel → Storage if you want image uploads in the editor. Then point your domain at the project and update `siteConfig.url` to match. Canonical URLs, the sitemap, RSS and social cards are all built from it.

## Scripts

Run these from the repository root.

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm typecheck` | Type-check every package |
| `pnpm lint` / `pnpm lint-format` | Check with Biome / check and fix |
| `pnpm db:generate` | Generate a migration after editing `packages/db/src/schema.ts` |
| `pnpm db:migrate` | Apply pending migrations |
| `pnpm db:studio` | Open Drizzle Studio |

## Adding UI components

shadcn/ui components go into `packages/ui`:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

```tsx
import { Button } from "@workspace/ui/components/button"
```

## Deployment

The site is built for Vercel. Set the same environment variables in the project settings, and run `pnpm db:migrate` against the production database before deploying schema changes. Published posts are prerendered. Saving a post in the editor refreshes the blog pages, feeds and sitemap, so no redeploy is needed for new content.

## CI and releases

Work happens on **`dev`**, the default branch. **`main`** is production: it changes only through a release pull request from `dev`, and Vercel deploys it. [`docs/branching.md`](docs/branching.md) covers the full flow and the recommended branch protection rules.

GitHub Actions in `.github/` check every change and version the project:

| Workflow | Runs on | What it does |
| --- | --- | --- |
| [`ci.yml`](.github/workflows/ci.yml) | Every PR, pushes to `dev` and `main` | Biome lint and format check, typecheck, then a production build |
| [`pr-title.yml`](.github/workflows/pr-title.yml) | PRs | Requires a [Conventional Commit](https://www.conventionalcommits.org) title, which decides the version bump |
| [`release.yml`](.github/workflows/release.yml) | Release PR merged into `main` | Bumps the version in `package.json`, tags `vX.Y.Z`, publishes a GitHub release with generated notes, and merges `main` back into `dev` |
| [`codeql.yml`](.github/workflows/codeql.yml) | PRs, pushes to `dev` and `main`, weekly | CodeQL security scan of the TypeScript and the workflows |
| [`dependabot.yml`](.github/dependabot.yml) | Weekly / monthly | Grouped dependency and GitHub Actions updates |

**How the version is bumped.** A `release:major`, `release:minor` or `release:patch` label on the PR wins. Otherwise the title decides: `feat!:` (or any `type!:`) is major, `feat:` is minor, and everything else is a patch. Label a PR `skip-release` to merge it without a release. Release notes are grouped by label (see [`.github/release.yml`](.github/release.yml)).

**One-time setup on GitHub:**

1. Add a `DATABASE_URL` repository secret (Settings → Secrets and variables → Actions) so CI can run the build. The build prerenders published posts, so it needs a database. Use a separate Neon branch, not production. Without the secret, CI still lints and typechecks and skips the build.
2. Create the labels `release:major`, `release:minor`, `release:patch`, `skip-release` and `dependencies`.
3. Make `dev` the default branch, and add the rulesets and release app described in [`docs/branching.md`](docs/branching.md). The release workflow needs that app to push its version commit to a protected `main`.
4. Make `Lint and typecheck`, `Build`, `Conventional title` and `Analyze (javascript-typescript)` required checks for `main`.
5. Turn on **Private vulnerability reporting** (Settings → Code security), which [SECURITY.md](SECURITY.md) points reporters to. Leave CodeQL's "default setup" off there, because `codeql.yml` is the advanced setup and the two can't run together.

Deployment itself is handled by Vercel's Git integration: every push to `main` deploys to production, and every push to `dev` and every PR gets a preview URL.

## Contributing

Bug fixes, new tools and improvements for forks are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) for setup, code conventions and how PRs are titled. To report a vulnerability, follow [SECURITY.md](SECURITY.md) rather than opening an issue.

## Docs

- [`docs/design.md`](docs/design.md): design spec (tokens, frame system, components)
- [`docs/site-structure.md`](docs/site-structure.md): sitemap, content model, SEO/AEO plan

## License

[MIT](LICENSE) © 2026 Siddhant Singh. You're free to use, copy and adapt this code for your own site. Keep the copyright and license notice, and swap in your own content (see [Make it your own](#make-it-your-own)).
