# Contributing

Thanks for helping out. This is a personal site, but its tools, blog engine and editor are meant to be useful to others. Bug fixes, new tools and improvements for people forking it are all welcome.

## Before you start

- **Bugs and small fixes:** open a pull request directly. An issue first is welcome but not required.
- **New features, new tools or design changes:** open an issue first so we can agree on the shape before you build it.
- **Security problems:** don't open an issue. Follow [SECURITY.md](SECURITY.md).

## Local setup

You need Node 24 and pnpm (the version is pinned in `package.json`; `corepack enable` picks it up).

```bash
pnpm install
```

Copy `apps/web/.env.example` to `apps/web/.env.local`. Only `DATABASE_URL` is needed for the public site. The auth variables are needed for `/admin`, and the Blob token for image uploads. A free [Neon](https://neon.tech) project is enough. Use a branch of your own, never someone else's data.

```bash
pnpm db:migrate
```

```bash
pnpm dev
```

## Making changes

### Code style

[Biome](https://biomejs.dev) formats and lints everything: tabs, double quotes, no semicolons, 100-column lines. Run it before you push:

```bash
pnpm lint-format
```

Match the code around your change: its naming, comment density and idioms. Comments explain *why*, not *what*.

### Where code goes

- `apps/web/app`: routes only. Keep pages thin.
- `apps/web/modules/<context>`: domain logic, split into `domain` (rules, no I/O), `application` (use cases and ports) and `infrastructure` (Drizzle, Neon Auth, Vercel Blob adapters).
- `apps/web/lib/server/container.ts`: the only place that wires adapters to use cases.
- `apps/web/features`: interactive client features (the blog editor and each tool).
- `packages/ui`: shared shadcn/ui components and the theme. `docs/design.md` describes the design system.

Every admin page, server action and route handler must call `requireAdmin()` or `getCurrentAdmin()` itself. The proxy only redirects signed-out visitors and isn't an authorisation check.

### Next.js 16

This repo uses Next.js 16, whose APIs differ from older versions (for example, `proxy.ts` replaces middleware). Check the docs bundled at `node_modules/next/dist/docs/` before relying on what you remember from older versions.

### Database changes

Edit `packages/db/src/schema.ts`, then generate a migration and commit it with your change:

```bash
pnpm db:generate
```

Never edit a migration that is already on `dev` or `main`; add a new one.

### Adding a tool

Create `apps/web/features/tools/<slug>/`, register the component in `features/tools/registry.tsx` and add its listing to `tools` in `apps/web/lib/content.ts`. Tools run entirely in the browser; don't send user input to a server.

## Pull requests

1. Branch from `dev`, the default branch, and open your PR against it. Keep each PR to one change. `main` is production and only takes release PRs from `dev` (see [docs/branching.md](docs/branching.md)).
2. Make sure these pass locally:

   ```bash
   pnpm lint
   ```

   ```bash
   pnpm typecheck
   ```

3. Give the PR a [Conventional Commit](https://www.conventionalcommits.org) title. CI enforces it, release notes list it, and on a release PR it chooses the version bump:

   | Title | Release |
   | --- | --- |
   | `feat: add tag pages`, `feat(tools): JSON formatter` | minor |
   | `fix(blog): RSS dates in UTC`, `docs: …`, `chore: …` | patch |
   | `feat!: move posts to /writing` | major |

4. Fill in the PR template. Add screenshots for visual changes, in both light and dark themes and at phone width.

Maintainers can override the bump with a `release:major`, `release:minor` or `release:patch` label, or skip the release with `skip-release`.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
