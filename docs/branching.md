# Branches, releases and protection rules

## The flow

```
feature branch ──PR──▶ dev ──release PR──▶ main ──▶ Vercel production
                        ▲                    │
                        └── merge back ──────┘  (release workflow)
```

- **`dev`** is the default branch. Day-to-day commits land here, directly or through pull requests. GitHub counts commits on the default branch towards your contribution graph, so they show up straight away.
- **`main`** is production. Vercel deploys every push to it. It only changes through a release pull request from `dev`, plus the release workflow's version commit.
- **A release** is a PR from `dev` into `main`, merged with a **merge commit**. [`release.yml`](../.github/workflows/release.yml) bumps the version on `main`, tags `vX.Y.Z`, publishes the GitHub release, then merges `main` back into `dev`.
- **The bump** comes from the release PR: a `release:major` / `release:minor` / `release:patch` label, or its title (`feat!:` major, `feat:` minor, anything else patch). Title the release PR after its biggest change, e.g. `feat: tag pages and RSS categories`.
- **`v1`** keeps the previous site. Leave it alone, or archive it with a tag and delete it.

Vercel builds a preview of every push to `dev` and every PR. To get a stable URL for it, assign a domain such as `dev.siddsingh.dev` to the `dev` branch (Vercel → Settings → Domains).

## One-time switch to `dev` as the default

1. **Settings → General → Default branch:** switch to `dev`. New PRs, including Dependabot's, now target `dev`.
2. Retarget or close any open PRs still aimed at `main`, such as earlier Dependabot updates. On each PR, click **Edit** next to the title and change the base to `dev`.
3. Locally, run `git remote set-head origin -a`.

## Release bot (needed once `main` is protected)

The default `GITHUB_TOKEN` can't push past branch protection, so the release workflow uses a small GitHub App when one is configured:

1. **Settings (your account) → Developer settings → GitHub Apps → New GitHub App.** Give it a name (e.g. `siddsingh-release`), set the homepage to the repo URL and turn off **Webhook**.
2. **Repository permissions:** Contents → Read and write. Nothing else.
3. Create the app, note its **App ID**, then **Generate a private key**. A `.pem` file downloads.
4. **Install App** on this repository only.
5. In this repo: **Settings → Secrets and variables → Actions**. Add `RELEASE_APP_ID` (the App ID) and `RELEASE_APP_PRIVATE_KEY` (the whole `.pem` contents).
6. Add the app to the **bypass list** of the `main` and tag rulesets below.

Its commits carry `[skip ci]`, so they don't start CI or another release.

## Rulesets

Create these under **Settings → Rules → Rulesets → New branch ruleset**. Rulesets replace the older "branch protection rules" and can be exported or imported as JSON.

### `main`: production

**Target:** `main`. **Enforcement:** Active. **Bypass list:** the release app (always allow).

| Rule | Setting | Why |
| --- | --- | --- |
| Restrict deletions | On | Production can't be deleted by accident |
| Block force pushes | On | History on `main` is never rewritten |
| Require a pull request before merging | On, **0** required approvals | Every change arrives as a reviewed release PR. You can't approve your own PR, so 1 approval would lock a solo maintainer out |
| ↳ Require conversation resolution | On | Open review comments must be settled first |
| ↳ Allowed merge methods | **Merge** only | Squash or rebase would give `main` commits that `dev` doesn't have, so the next release PR would conflict |
| Require status checks to pass | On | Nothing broken reaches production |
| ↳ Required checks | `Lint and typecheck`, `Build`, `Conventional title`, `Analyze (javascript-typescript)` | The jobs in `ci.yml`, `pr-title.yml` and `codeql.yml` |
| ↳ Require branches to be up to date | On | The release-back merge keeps `dev` level with `main`, so this rarely gets in the way |
| Require code scanning results | Optional: CodeQL, **High or higher** | Blocks a release that introduces a serious CodeQL alert |
| Require linear history | **Off** | It forbids the merge commits this flow relies on |
| Require signed commits | Off unless you sign every commit | It also applies to every `dev` commit merged in, and to the release bot's commits |

### `dev`: everyday work

**Target:** `dev` (the default branch). **Enforcement:** Active. **Bypass list:** the release app.

| Rule | Setting | Why |
| --- | --- | --- |
| Restrict deletions | On | Keeps the default branch |
| Block force pushes | On | Your contribution history and others' branches stay intact |
| Require a pull request | **Off** | You can commit straight to `dev` |
| Require status checks | Off | Required checks would block direct pushes. CI still runs on every push and shows failures |

If outside contributors start sending PRs, their PRs already target `dev` and run CI. For them, prefer **Rebase** or **Merge** over **Squash** if you want each of their commits kept.

### Tags `v*`: releases

**New tag ruleset → Target:** `v*`. **Bypass list:** the release app.

| Rule | Setting |
| --- | --- |
| Restrict creations | On: only the release workflow creates version tags |
| Restrict updates | On |
| Restrict deletions | On |

## Other repository settings

- **General → Pull Requests:** allow merge commits. Optionally allow rebase merging for contributor PRs into `dev`. Turn on **Automatically delete head branches**, and optionally **Always suggest updating pull request branches**.
- **General → Features:** turn off Wikis and Projects if you don't use them.
- **Code security:** turn on Dependabot alerts, Dependabot security updates, secret scanning with **push protection**, and private vulnerability reporting. Leave CodeQL's default setup off, because `codeql.yml` replaces it.
- **Actions → General:** workflow permissions **Read repository contents** (each workflow asks for more when it needs it). Require approval for workflows from first-time contributors on fork PRs.
- **Vercel → Git:** production branch stays `main`.
