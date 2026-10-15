# siddsingh.dev

Personal portfolio and blog for Siddhant Singh, built with Next.js, TypeScript, and Once UI.

## What's inside

- Home page with featured work
- About page with experience, studies, and focus areas
- Blog for long-form posts and notes
- Work section for selected projects
- Tools hub with browser-based utilities
- SEO support with metadata, sitemap, robots, RSS, and OG image generation

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Once UI
- shadcn/ui with base ui
- MDX
- Sass

## Getting Started

```bash
pnpm install
pnpm dev
```

## Available Scripts

- `pnpm dev` - run the local dev server
- `pnpm build` - build for production
- `pnpm start` - start the production server
- `pnpm lint-format` - format and check with Biome

## Configuration

- Site config: `src/resources/config.ts`
- Content and profile data: `src/resources/content.tsx`
- Environment variables: `.env.example`

## Screenshot Export API

`POST /api/screenshot-mockup/export` exports the screenshot mockup generator from an uploaded image or image URL.

- Auth: `Authorization: Bearer $SCREENSHOT_EXPORT_TOKEN`; falls back to `PAGE_ACCESS_PASSWORD` when unset.
- Body: JSON with `image`, optional `backgroundImage`, optional `customization`, `format` (`png` or `svg`), and `scale`.
- Multipart form data is also supported with `image`, optional `backgroundImage`, and `customization` as a JSON string.
- Use `curl --fail` when writing to `--output` so `401`/error responses do not create image files.

## Content

- Blog posts: `src/app/blog/posts`
- Work entries: `src/app/work/projects`

## License

See [LICENSE](./LICENSE).
