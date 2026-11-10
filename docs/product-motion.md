# Product home — guided walkthrough

## Scope and decision

Christophe approved the proposed visual direction in the Site chat on 10 November 2026 (reply: “go”): a more expressive asymmetric hero, a short guided product walkthrough, stronger contrast, and useful motion. This change only affects the English and French `stoa-web` homepages. Product services, other repositories, public ports and credentials are outside scope.

## Experience

- The hero illustrates agent → STOA → API, using lightweight CSS motion. It does not run requests.
- Four tabs follow a call: Discover, Authorize, Call, Observe. The first and last use the existing, historical product screenshots. The middle stages are explicitly labelled educational illustrations.
- Playback is user-initiated, takes 18 seconds, and stops after the fourth stage. Users can pause, replay or select a stage. It stops when the walkthrough leaves the viewport, the page becomes hidden, a panel receives keyboard focus, or a screenshot is opened.
- Arrow keys, Home and End move between tabs. Screenshot dialogs restore focus to the opener.
- Reduced-motion users get the manual tabs without timed playback or travelling particles. No scroll interception, video, runtime dependency or new analytics is introduced.
- The existing Docs, CAB, Labs and GitHub destinations are preserved.

## Files

`ProductScene.astro` renders the hero illustration. `ProductJourney.astro` renders the walkthrough. Copy is bilingual in `product-journey.ts`. `product-home.ts` owns the local interactions; `product-motion.css` adds the new presentation after the retained base styles.

## Verification

The Node 24 / Astro 7 build generates all 11 existing routes. Browser checks cover the four stages, keyboard navigation, playback/pause/replay, screenshot zoom and focus restoration, English/French and mobile layout. Exact dated results and screenshots are kept with the Site coordination evidence; no form or product API is called during the walkthrough.

## Rollback

Revert the single change commit through a PR and let the existing Vercel deployment follow main. No data migration or service setting needs rollback.

## Visual evidence

![Desktop hero](assets/product-motion-desktop.png)

![Mobile hero](assets/product-motion-mobile.png)
