// The "?short-link" suffix gives this script its own copy of the consent helpers when bundled.
// A plain import would move them into a chunk shared with every other page and turn this
// redirect into a chain of script requests; with its own copy the build embeds the whole
// script in the page, so the redirect never waits for another file.
import {
  CONSENT_KEY, GA_ID, cleanUrl, configureGoogle, googleTag, isProductionHost, pageContext, parseConsent, queueConsentDefaults,
} from './analytics-consent.js?short-link';
import { SHORT_LINK_SLUGS, SHORT_LINK_TARGET, shortLinkPath } from '../data/short-links.js';

// Longest a consented visit waits for Google before leaving.
export const REDIRECT_TIMEOUT_MS = 800;

export function redirectShortLink({ window: win, document: doc, slug, now = Date.now }) {
  const disableKey = `ga-disable-${GA_ID}`;
  let left = false;
  let sent = false;
  let timer;

  function leave() {
    if (left) return;
    left = true;
    // A tag that is still downloading must stay silent once the visitor is leaving.
    if (!sent) win[disableKey] = true;
    if (timer !== undefined) win.clearTimeout(timer);
    // Always the fixed target: nothing from the incoming address is forwarded.
    win.location.replace(SHORT_LINK_TARGET);
  }

  function accepted() {
    try { return parseConsent(win.localStorage.getItem(CONSENT_KEY), now())?.choice === 'accepted'; }
    catch { return false; }
  }

  try {
    if (!SHORT_LINK_SLUGS.includes(slug) || !isProductionHost(win.location) || !accepted()) return leave();

    timer = win.setTimeout(leave, REDIRECT_TIMEOUT_MS);
    queueConsentDefaults(win);
    win[disableKey] = false;
    const node = googleTag(doc);
    node.onload = () => {
      if (left) return;
      try {
        // A withdrawal while the library is downloading must never flush events.
        if (!accepted()) return leave();
        // Built from the known slug and the referring origin only, never from the incoming address.
        const values = pageContext(cleanUrl(shortLinkPath(slug), win.location.origin), cleanUrl('/', doc.referrer), doc.title);
        configureGoogle(win, now(), values);
        sent = true;
        win.gtag('event', 'page_view', { ...values, event_callback: leave });
      } catch { leave(); }
    };
    node.onerror = leave;
    doc.head.appendChild(node);
  } catch { leave(); }
}

export function mountShortLink(win = window, doc = document) {
  redirectShortLink({ window: win, document: doc, slug: doc.documentElement.dataset.shortLink });
}
