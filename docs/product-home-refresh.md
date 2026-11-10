# Product-focused homepages — CAB-2596

The English and French homepages introduce STOA as an API and AI-agent product. They replace the long list of repeated capability and pricing sections with a product view, three capabilities, an architecture diagram and resource links.

## Scope

- `/` and `/fr/` use `ProductHome.astro`, `ProductLayout.astro`, `src/i18n/product-home.ts`, `src/scripts/product-home.ts` client controls and `product.css`.
- The layout preserves the existing analytics integration, uses system fonts and provides canonical URLs and language alternatives for both homepages.
- CAB's advisory services are at <https://cab-ingenierie.com/>. Labs is a page within that site: <https://cab-ingenierie.com/labs>.
- Documentation remains at <https://docs.gostoa.dev/>. The header, mobile menu and resources link directly to the quickstart, architecture and Control Plane API reference.
- Existing demo, pricing, privacy and feedback routes retain their current layouts. Product code, the documentation repository, CAB/Labs and deployment settings are outside this change.

## Product captures

The image selector and enlarged view show repository screenshots of demonstration environments. They are historical captures, not current traffic, usage, availability or performance claims. The controls do not connect to a product account.

- `console-catalogue.png`: copied from `stoa-platform/stoa`, `docs/assets/screenshot-apis.png`; SHA-256 `441e257922890bd4d8da0c35771ac199d6e6ee419e5c9653a2372b132bcfe221`.
- `console-trafic.png`: copied from `stoa-platform/stoa`, `docs/assets/screenshot-call-flow.png`; SHA-256 `c4aed5ee66ff2fd830ef87d427e0ed251827a00e124b8ad1a6d4a16154142135`.

Keep the caption and alternative text aligned when replacing an image. Visible labels and interaction strings are defined for English and French in `src/i18n/product-home.ts`.

## Validation

- `npm ci --ignore-scripts --prefer-offline --no-audit --no-fund`
- `npm run build`: 11 static pages generated.
- Generated homepages checked for language, canonical URLs, unique IDs, local links and assets, and the required CAB/Labs/Docs destinations.
- Browser checks on the built output: French and English desktop rendering, 390 px mobile rendering, language switching, keyboard image selection, image enlargement and Escape, mobile navigation, and documentation links.
- Screenshots: [desktop](assets/product-home-fr.png), [mobile](assets/product-home-mobile-fr.png), [documentation entry points](assets/product-docs-mobile-fr.png).

## Release and rollback

This change is prepared on a separate branch. It does not update production. The repository's existing Vercel process deploys production from `main`; merge/deployment is a separate action. A release can be reverted by reverting its merge commit and letting the same deployment process rebuild the previous site. No infrastructure or configuration migration is required.
