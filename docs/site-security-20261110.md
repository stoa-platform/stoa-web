# Site dependency security update — CAB-2596

## Advisory and scope

The site used Astro 4.16, affected by [GHSA-26w7-cxv4-gfx2](https://github.com/advisories/GHSA-26w7-cxv4-gfx2): untrusted AVIF processing in the default Sharp image service can result in remote code execution. The advisory patches Astro at 7.2.8; this change adopts Astro 7.4.8 and the supported dependency graph.

This affects the build tooling for `stoa-platform/stoa-web`. No platform service, product repository, CAB/Labs site, documentation repository, secret, DNS or runtime endpoint is changed.

## Changes

- Astro 7.4.8 and sitemap 3.7.4, with Node 24 LTS recorded in package engines.
- Tailwind stays on 3.4.19. Its old Astro integration does not support Astro 7; PostCSS and Autoprefixer replace that integration, with the same base/components/utilities stylesheet imported before each layout's styles.
- `compressHTML: true` retains the earlier whitespace handling.
- Previous transitive overrides that forced older major dependency versions are removed. The lockfile records the resolved versions.
- The remaining compatible `postcss-selector-parser` update removes the final moderate advisory.

## Validation

- Clean dependency installation with Node 24.22.2.
- `npm audit --json`: 9 affected packages before (1 critical, 5 high, 2 moderate, 1 low); 0 vulnerabilities after.
- Static build succeeds with Node 24: all 11 routes generated.
- Generated local assets resolve on all routes; homepage canonical URLs, language alternatives and CAB/Labs/Docs destinations checked.

## Deployment

The correction is prepared on the existing site branch. Production is unchanged until the branch is merged and deployed through the repository's normal Vercel process. Dependency alerts on the default branch cannot close from a branch-only correction.
