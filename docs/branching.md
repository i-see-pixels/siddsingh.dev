# Branches and releases

## The flow

```
feature branch ──PR──▶ dev ──release PR──▶ main ──▶ Vercel production
                        ▲                    │
                        └── merge back ──────┘  (release workflow)
```

- **`dev`** is the default branch. Day-to-day work lands here: directly from the maintainer, or through pull requests from everyone else. Vercel builds a preview of every push.
- **`main`** is production, and Vercel deploys every push to it. It only changes through a release pull request from `dev`, plus the release workflow's version commit.
- **`v1`** keeps the previous version of the site, for reference only.

## How a release works

1. Open a pull request from `dev` into `main`. Give it a [Conventional Commit](https://www.conventionalcommits.org) title named after its biggest change, e.g. `feat: tag pages and RSS categories`.
2. The title sets the version bump: `feat!:` (or any `type!:`) is major, `feat:` is minor, and anything else is a patch. A `release:major`, `release:minor` or `release:patch` label overrides the title, and `skip-release` merges without a release.
3. Merge it with a **merge commit**. Squash and rebase are turned off for `main`, because they would give `main` commits that `dev` doesn't have.
4. [`release.yml`](../.github/workflows/release.yml) then:
   - bumps `version` in `package.json`
   - commits it to `main` and tags `vX.Y.Z`
   - publishes a GitHub release with notes grouped by label ([`.github/release.yml`](../.github/release.yml))
   - merges `main` back into `dev`, so the next release PR starts level

Its commits carry `[skip ci]`, so they don't start CI or another release, and the `ignoreCommand` in [`apps/web/vercel.json`](../apps/web/vercel.json) skips Vercel builds for any commit starting with `chore(release):`. Vercel deploys the merge to production.

## Protection on this repository

| Ref | Rules |
| --- | --- |
| `main` | No deletion or force push. Changes only through a PR merged with a merge commit, with open review comments resolved. `Lint and typecheck`, `Build`, `Conventional title` and `Analyze (javascript-typescript)` must pass on an up-to-date branch |
| `dev` | No deletion or force push. The maintainer commits directly; contributors open PRs |
| `v*` tags | Only the release workflow can create, change or delete them |

The release workflow's GitHub App is the only bypass on all three. Workflows on pull requests from outside contributors wait for maintainer approval before they run.

## Setting this up on your fork

The workflows run on a fork as they are. To get automatic releases and the same protection:

1. **Default branch:** create `dev` from `main` and make it the default (Settings → General).
2. **Labels:** create `release:major`, `release:minor`, `release:patch`, `skip-release` and `dependencies`.
3. **CI build:** add a `DATABASE_URL` Actions secret pointing at a Neon branch made for CI, not production. Without it, CI skips the build.
4. **Release app:** the default `GITHUB_TOKEN` can't push past branch protection, so releases use a small GitHub App:
   1. Your account's Settings → Developer settings → GitHub Apps → **New GitHub App**. Turn off **Webhook**, and give it only **Contents: Read and write** under repository permissions.
   2. Generate a private key and install the app on your fork only.
   3. Add the `RELEASE_APP_ID` and `RELEASE_APP_PRIVATE_KEY` (the whole `.pem` file) Actions secrets.
5. **Rulesets** (Settings → Rules → Rulesets): recreate the three in the table above, with your app on each bypass list. Leave **Require linear history** off, because the release flow uses merge commits. Only turn on **Require signed commits** if every commit you push is signed.
6. **Security** (Settings → Code security): turn on Dependabot alerts and security updates, secret scanning with push protection, and private vulnerability reporting. Leave CodeQL's default setup off, because `codeql.yml` replaces it.
7. **Actions** (Settings → Actions → General): set workflow permissions to read-only, and require approval for workflows from all outside contributors.
8. **Vercel:** set the production branch to `main` and keep **Git Fork Protection** on.

If you don't want releases, delete `release.yml` and skip steps 2 and 4.
