# Audience measurement and consent

Prepared on 10 November 2026 from `main` at `d4a6fa9dc462820cca1165aa9ee943cd86aa2162`. This change is local; it has not been pushed, merged or deployed.

## Scope and behaviour

Both `Layout.astro` and `ProductLayout.astro` include the same FR/EN control. This covers all 11 generated pages, including privacy, pricing, demo, feedback and 404 pages.

The confirmed marketing measurement ID is `G-8PL054C7RH`. The shared STOA/documentation Clarity project ID is `zbgxdbg9n9`. Neither library loads until an explicit acceptance of Google Analytics and Clarity, or a still-valid combined acceptance saved in this browser. Refuse and Accept have identical sizing and styling. The permanent Privacy choices button reopens the controls; a separate permanent withdrawal button appears while consent is active.

Both tags also require HTTPS and the exact hostname `gostoa.dev` or `www.gostoa.dev`. Localhost, local IP addresses, HTTP and Vercel preview hosts retain the consent interface for review but never load either library or send analytics events, including after acceptance. Product application hosts are outside this allowlist.

Acceptance and refusal are stored in local storage under `stoa.analytics-consent.v2` for six calendar months. A previous Google-only v1 receipt cannot enable the new replay feature. An invalid, future-dated or expired choice does not grant consent. When storage is unavailable, a choice applies only to the current page. Withdrawal immediately disables the Google tag, stops Clarity, removes both scripts and accessible `_ga`, `_clck` and `_clsk` cookies, clears queued commands and reloads the page to unload the libraries. Expiry and a refusal from another tab use the same shutdown. This does not delete previously collected information from Google or Microsoft.

The Google tag runs in basic consent mode. Advertising storage, advertising user data and advertising personalisation stay denied. Google signals and advertising personalisation signals are disabled in the configuration. The library is never preconnected or preloaded by this integration. [Google's basic consent guide](https://developers.google.com/tag-platform/security/guides/consent?consentmode=basic), [privacy parameters and the disable flag](https://developers.google.com/tag-platform/security/guides/privacy).

Automatic initial page views are disabled. A manual page view is emitted after the tag loads, with `page_location` and `page_referrer` reduced to protocol, host and path. Query strings and fragments are excluded. A change only to a query or fragment does not add a view. [Google's manual page view guide](https://developers.google.com/analytics/devguides/collection/ga4/views).

Manual `navigation_click` events are limited to known documentation, quickstart and contact links. They carry a fixed `link_category` (`docs`, `quickstart` or `contact`), clean page context and `site_section: marketing`. No destination URL, link text, email address, form value or message body is sent by these click events. Page views also carry `site_section: marketing` to distinguish this site from documentation using the same historical ID.

## Clarity replays and masking

Clarity uses the recommended `consentv2` call with `analytics_Storage: granted` and `ad_Storage: denied` after the combined choice. It is never loaded in the denied state, so its cookieless tracking mode is not used. Withdrawal calls `stop`, removes its script and queue, and removes accessible first-party cookies for host and parent-domain scopes. No `identify` call or user/account identifier is supplied. The only custom tag is the fixed `site_section: marketing`. [Microsoft's consent API](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-consent-api-v2), [official stop implementation](https://github.com/microsoft/clarity/blob/master/packages/clarity-js/src/clarity.ts).

The project owner configures Strict masking and disables automatic cookies in the Clarity interface before deployment; consentv2 supplies the explicit visitor decision. The controller sets `data-clarity-mask="true"` on the entire body before inserting the tag, so strict masking does not depend on propagation of that project setting. The demo form, its children and feedback iframes also carry the mask; form controls are masked again before loading. No unmask directive is used. Third-party iframe contents cannot be inspected by this site's integration. [Microsoft's masking guide](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-masking).

Capture listeners are installed before either SDK. Focus on an input, textarea, select, editable element or iframe stops Clarity, removes its script and cookies and latches it off until navigation to a new document. The form is not interrupted; Google continues only with the limited event payloads above. If a Clarity script was already downloading, its load callback repeats the stop. Documents with query parameters or fragments in their current or referring URL do not start Clarity. This conservative exclusion reduces URL exposure but is not a promise of complete anonymisation.

The latch describes this controller, not an unconditional guarantee about all SDK internals. A focused test of official `history.ts` at commit `8aa987e469a1fe11dbf984ffc98f3344468e4af4` (SDK 0.8.69, source SHA-256 `b1017ec0630b1feeb3c241f1e42bf0a6ea28350cba4c62872d0c52a8ddc7653d`) reproduced a restart timer surviving a later `stop`. Hash-only changes do not schedule that timer, and history proxies do not compute while the core is already inactive. Current site sources contain no pushState/replaceState calls or SPA router; regular page navigation unloads the document. Any future SPA navigation requires a fresh review of capture ordering and pending restarts. No global timer patch or SDK fork is introduced. [Official history module](https://github.com/microsoft/clarity/blob/8aa987e469a1fe11dbf984ffc98f3344468e4af4/packages/clarity-js/src/core/history.ts).

Clarity reconstructs browsing activity from the public page and interactions; it is not a video of the screen. DOM masking does not provide the same URL cleanup as the manual Google events. Microsoft notes that URL-parameter masking is separate and does not cover referrer or clicked URLs. Sensitive values must not be embedded in those URLs. The privacy pages explicitly distinguish this from Google's cleaned event payloads. [Microsoft's URL-masking FAQ](https://learn.microsoft.com/en-us/clarity/faq/).

## Replaced service

Google Analytics and Clarity replace the previous Vercel Web Analytics inclusion in both layouts. Both services use the same explicit choice. The Vercel dependency remains in the package manifest but is no longer imported or rendered. This code change does not alter historical Vercel reports or their retention. Existing Google Fonts requests on the older layout are unrelated to audience measurement.

`robots.txt` now allows `/_astro/` resources to be crawled; `/api/` remains disallowed. The sitemap declaration is unchanged. The privacy pages describe only `gostoa.dev`; they do not promise the same configuration for the portal, console or documentation service.

## Account-side prerequisite

The site owner is handling the existing GA4 stream settings separately. Before deployment, Enhanced Measurement must be disabled for this stream, including history page changes, outbound clicks and form interactions. Otherwise Google can produce additional automatic events independent of `send_page_view: false`, including fields outside this limited event contract. No account settings are modified by this code change. No new property, stream or tag container is created here.

## Verification

Node 24 is required by the repository. The checked runtime is v24.22.2.

```sh
npm run test:consent
npm run build
npm run test:consent-build
```

The logic tests use an in-memory browser substitute and make no network requests. They cover denial, grant, one Google tag/one page, advertising controls, six-month expiry, storage failures, withdrawal during loading, cookie removal, cross-tab refusal, repeat navigation and sanitised click/page context. Clarity tests cover a missing ID, pre-consent blocking, production-host blocking, consentv2, stop/cookie removal and rejection of older consent receipts. Built-output tests cover the controls on all pages, absence of eager analytics scripts, masked forms/iframes, accessible local assets and robots rules.

Browser review should check FR/EN, mobile layout, equal choices, keyboard focus, persistent controls and withdrawal. On a clean browser, there should be no Google or Clarity request before acceptance or after refusal. After acceptance on a production host, verify a cleaned Google `page_view` and the masked Clarity replay; after withdrawal, verify that further analytics requests stop. Account-side reception, actual replay masking and retention are separate checks and are not established by a successful local build.

### Local review before the hostname restriction

During the parent agent's Chrome review on 10 November 2026, acceptance at `localhost` loaded the Google script before this hostname restriction was added. Withdrawal then reloaded the page and disabled the tag. This may have produced a localhost test visit in the property; it is a test artifact and must not be counted as a business visit. The updated local build blocks Google loading even when acceptance is selected.

## Marketing decisions

Before changing a marketing page, consult Google Analytics, Search Console and Clarity together. Record the report date, observed time window, page or audience scope and source of the evidence. Separate search visibility, consented visits, navigation clicks and replay observations instead of treating them as interchangeable counts. Keep internal and localhost tests separate from business traffic.

Do not draw a conversion or audience conclusion from a small or incomplete sample. State the available counts and uncertainty, and compare equivalent windows when a comparison is useful. A contact click measures intent to open a contact route; it is not proof of an enquiry, a lead or a sale. Use the observations to formulate a concrete change and a checkable result, without inventing missing business outcomes.
