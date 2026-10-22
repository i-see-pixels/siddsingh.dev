# Security policy

## Supported versions

Only the latest release, as deployed at [siddsingh.dev](https://siddsingh.dev) from `main`, gets security fixes. If you run a fork, pull fixes from `main`.

## Reporting a vulnerability

Please don't open a public issue, pull request or discussion for a security problem.

Report it privately through [GitHub's private vulnerability reporting](https://github.com/i-see-pixels/siddsingh.dev/security/advisories/new). If you can't use that, email **siddhant06137@gmail.com** with "Security" in the subject.

Include what you can of:

- the affected URL, route or file
- steps to reproduce, or a proof of concept
- what an attacker could do with it
- any ideas for a fix

You can expect:

- an acknowledgement within **3 days**
- an assessment and a plan within **7 days**
- a fix as soon as practical, usually within **30 days** for confirmed issues, with credit in the release notes unless you'd rather stay anonymous

## Scope

In scope:

- this repository's code: the site, the `/admin` area and its sign-in, the blog editor, media uploads and the API routes
- the deployed site at siddsingh.dev

Out of scope:

- vulnerabilities in third-party services (Neon, Vercel, GitHub); report those to the vendor
- reports from automated scanners with no demonstrated impact
- missing security headers or best-practice suggestions with no concrete exploit
- denial of service, spam, or social engineering

## Testing safely

Test against your own deployment of this code where you can. If you test against siddsingh.dev, don't access or change data that isn't yours, don't degrade the service, and stop once you've confirmed the issue.
