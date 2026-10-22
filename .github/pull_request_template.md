<!--
Title: a Conventional Commit, e.g. "feat(tools): add JSON formatter" or "fix(blog): RSS dates in UTC".
It sets the release: feat → minor, feat! → major, anything else → patch.
-->

## What and why

<!-- What does this change, and why? Link the issue it closes: "Closes #123". -->

## How to test

<!-- Steps a reviewer can follow, with the routes to open. -->

## Screenshots

<!-- For visual changes: light and dark theme, desktop and phone width. Delete if not visual. -->

## Checklist

- [ ] `pnpm lint` and `pnpm typecheck` pass
- [ ] Database changes include a migration from `pnpm db:generate`
- [ ] New admin pages, actions and route handlers check `requireAdmin()` / `getCurrentAdmin()`
- [ ] Docs updated if behaviour or setup changed (README, `.env.example`)
