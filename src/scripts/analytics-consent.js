import { SOCIAL_LINKS } from './social-links.js';

// Neither analytics library loads before the explicit Google + Clarity choice.
export const GA_ID = 'G-8PL054C7RH';
export const CLARITY_ID = 'zbgxdbg9n9';
export const CONSENT_KEY = 'stoa.analytics-consent.v2';
export const CONSENT_VERSION = 2;
const MAX_TIMER = 2_147_000_000;
const DENIED = { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };

export function sixMonthsFrom(timestamp) {
  const start = new Date(timestamp);
  const end = new Date(timestamp);
  end.setUTCDate(1);
  end.setUTCMonth(end.getUTCMonth() + 6);
  const lastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();
  end.setUTCDate(Math.min(start.getUTCDate(), lastDay));
  return end.getTime();
}

export function parseConsent(raw, now) {
  try {
    const value = JSON.parse(raw);
    if (value?.version !== CONSENT_VERSION || !['accepted', 'refused'].includes(value.choice)
      || !Number.isFinite(value.chosenAt) || value.chosenAt > now
      || !Number.isFinite(value.expiresAt) || value.expiresAt <= now
      || value.expiresAt !== sixMonthsFrom(value.chosenAt)) return null;
    return value;
  } catch { return null; }
}

export function cleanUrl(value, base) {
  try {
    const url = new URL(value, base);
    return ['https:', 'http:'].includes(url.protocol) ? url.origin + url.pathname : '';
  } catch { return ''; }
}

function socialCampaign(href) {
  const params = new URL(href).searchParams;
  const unique = name => {
    const values = params.getAll(name);
    return values.length === 1 ? values[0] : null;
  };
  const source = unique('utm_source');
  if (!['linkedin', 'x'].includes(source) || unique('utm_medium') !== 'social' || unique('utm_campaign') !== 'stoa') return {};

  const content = unique('utm_content');
  const campaign = { campaign_source: source, campaign_medium: 'social', campaign_name: 'stoa' };
  if (['company_profile', 'personal_profile', 'post'].includes(content)) campaign.campaign_content = content;
  return campaign;
}

export function linkCategory(value, base) {
  try {
    const url = new URL(value, base);
    const social = SOCIAL_LINKS.find(link => link.href === url.href);
    if (social) return social.category;
    const path = url.pathname.replace(/\/$/, '');
    if (url.hostname === 'docs.gostoa.dev') {
      return /\/(?:docs\/)?guides\/quickstart(?:\/|$)/.test(path) ? 'quickstart' : 'docs';
    }
    if (url.hostname === 'github.com' && /^\/stoa-platform\/stoa-quickstart(?:\/|$)/.test(path)) return 'quickstart';
    if (url.protocol === 'mailto:' && /^(hello|demo|sales)@gostoa\.dev$/i.test(url.pathname)) return 'contact';
    if (url.protocol === 'mailto:' && url.pathname.toLowerCase() === 'contact@cab-ingenierie.com') return 'contact';
    const origin = new URL(base).origin;
    if (url.origin === origin && (/^\/(?:fr\/)?demo$/.test(path) || url.hash === '#contact')) return 'contact';
    if (url.hostname === 'cab-ingenierie.com' && url.hash === '#contact') return 'contact';
    return null;
  } catch { return null; }
}

export function createAnalyticsConsent({ window: win, document: doc, now = Date.now, onState = () => {}, clarityId = CLARITY_ID }) {
  let memory = null;
  let memoryOnly = false;
  let script = null;
  let ready = false;
  let clarityScript = null;
  let claritySensitive = false;
  let lastPage = null;
  let expiryTimer;
  const disableKey = `ga-disable-${GA_ID}`;
  win[disableKey] = true;

  function current() {
    if (memoryOnly) return parseConsent(JSON.stringify(memory), now());
    try { return parseConsent(win.localStorage.getItem(CONSENT_KEY), now()); }
    catch { return parseConsent(JSON.stringify(memory), now()); }
  }

  function queueDefaults() {
    win.dataLayer = [];
    win.gtag = function () { win.dataLayer.push(arguments); };
    win.gtag('consent', 'default', { ...DENIED });
  }

  function removeCookies(clarityOnly = false) {
    if (!productionHost()) return;
    const names = doc.cookie.split(';').map(part => part.trim().split('=')[0])
      .filter(name => (!clarityOnly && /^_ga(?:_|$)/.test(name)) || ['_clck', '_clsk'].includes(name));
    const parts = win.location.hostname.split('.');
    const domains = [''];
    for (let index = 0; index < parts.length - 1; index++) {
      domains.push(`; domain=${parts.slice(index).join('.')}`);
      domains.push(`; domain=.${parts.slice(index).join('.')}`);
    }
    names.forEach(name => domains.forEach(domain => {
      doc.cookie = `${name}=; Max-Age=0; path=/${domain}; SameSite=Lax`;
    }));
  }

  function stopClarity() {
    const hadTag = clarityScript !== null;
    // Stop capture, not merely cookies: denied consent alone allows cookieless capture.
    if (clarityScript) {
      try { win.clarity?.('stop'); } catch { /* Cleanup still proceeds. */ }
      clarityScript.remove();
    }
    clarityScript = null;
    if (win.clarity?.q) win.clarity.q.length = 0;
    win.clarity = () => {};
    removeCookies(true);
    return hadTag;
  }

  function stop() {
    const hadTag = script !== null || ready || clarityScript !== null;
    win[disableKey] = true;
    ready = false;
    lastPage = null;
    if (script) script.remove();
    script = null;
    stopClarity();
    win.dataLayer = [];
    win.gtag = () => {};
    removeCookies();
    return hadTag;
  }

  function allowed() {
    if (current()?.choice === 'accepted') return true;
    stop();
    return false;
  }

  function context() {
    return {
      site_section: 'marketing',
      page_location: cleanUrl(win.location.href),
      page_referrer: cleanUrl(doc.referrer),
      page_title: doc.title,
    };
  }

  function pageView() {
    if (!allowed() || !ready) return;
    const values = context();
    if (lastPage === values.page_location) return;
    win.gtag('event', 'page_view', values);
    lastPage = values.page_location;
  }

  function productionHost() {
    return win.location.protocol === 'https:' && ['gostoa.dev', 'www.gostoa.dev'].includes(win.location.hostname);
  }

  function startClarity() {
    if (!productionHost() || !allowed() || clarityScript || claritySensitive || !/^[a-z0-9]+$/i.test(clarityId)) return;
    // Skip this document rather than transmit query or fragment values to a replay SDK.
    for (const value of [win.location.href, doc.referrer]) {
      if (!value) continue;
      try { const url = new URL(value); if (url.search || url.hash) return; } catch { return; }
    }
    doc.body?.setAttribute('data-clarity-mask', 'true');
    // Cover current and later added form fields, including derived messages inside forms.
    doc.querySelectorAll?.('form, input, textarea, select, [contenteditable]').forEach(node => node.setAttribute('data-clarity-mask', 'true'));
    win.clarity = function () { (win.clarity.q = win.clarity.q || []).push(arguments); };
    win.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' });
    win.clarity('set', 'site_section', 'marketing');
    const node = doc.createElement('script');
    clarityScript = node;
    node.async = true;
    node.referrerPolicy = 'origin';
    node.id = 'stoa-microsoft-clarity';
    node.src = `https://www.clarity.ms/tag/${clarityId}`;
    node.onload = () => {
      if (clarityScript !== node || claritySensitive) {
        // A download already in flight can finish after sensitive focus or withdrawal.
        try { win.clarity?.('stop'); } catch { /* Keep the wrapper disabled. */ }
        if (win.clarity?.q) win.clarity.q.length = 0;
        win.clarity = () => {};
        removeCookies(true);
        node.remove();
        return;
      }
      if (!allowed()) return;
      win.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' });
    };
    node.onerror = () => {
      if (clarityScript !== node) return;
      node.remove();
      clarityScript = null;
      if (win.clarity?.q) win.clarity.q.length = 0;
      win.clarity = () => {};
    };
    doc.head.appendChild(node);
  }

  function sensitiveFocus(event) {
    const field = event.target?.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"]), iframe');
    if (!field) return;
    claritySensitive = true;
    stopClarity(); // Google keeps measuring only the existing value-free events.
  }

  function start() {
    if (!productionHost()) return;
    if (script || ready || !allowed()) return;
    queueDefaults();
    win[disableKey] = false;
    const node = doc.createElement('script');
    script = node;
    node.async = true;
    node.referrerPolicy = 'origin';
    node.id = 'stoa-google-analytics';
    node.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    node.onload = () => {
      // A withdrawal while the library is downloading must never flush events.
      if (script !== node || !allowed()) return;
      win.gtag('consent', 'update', { ...DENIED, analytics_storage: 'granted' });
      win.gtag('set', 'ads_data_redaction', true);
      win.gtag('set', 'url_passthrough', false);
      win.gtag('js', new Date(now()));
      win.gtag('config', GA_ID, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        cookie_expires: 15_811_200,
        cookie_update: false,
        ...context(),
        ...socialCampaign(win.location.href),
      });
      ready = true;
      pageView();
    };
    node.onerror = () => {
      if (script !== node) return;
      stop();
    };
    doc.head.appendChild(node);
  }

  function refresh() {
    const choice = current();
    onState(choice?.choice ?? null);
    if (expiryTimer) win.clearTimeout(expiryTimer);
    if (choice) expiryTimer = win.setTimeout(refresh, Math.min(choice.expiresAt - now(), MAX_TIMER));
    if (choice?.choice === 'accepted') {
      start();
      startClarity();
      pageView();
    } else {
      // Unload a previously granted library on expiry or cross-tab withdrawal.
      if (stop()) win.location.reload();
    }
  }

  function choose(choice) {
    if (!['accepted', 'refused'].includes(choice)) return;
    const chosenAt = now();
    memory = { version: CONSENT_VERSION, choice, chosenAt, expiresAt: sixMonthsFrom(chosenAt) };
    try { win.localStorage.setItem(CONSENT_KEY, JSON.stringify(memory)); memoryOnly = false; }
    catch { memoryOnly = true; /* Current-page choice still works. */ }
    refresh();
  }

  function click(href) {
    if (!allowed() || !ready) return;
    const category = linkCategory(href, win.location.href);
    if (!category) return;
    const isSocial = SOCIAL_LINKS.some(link => link.category === category);
    const eventName = isSocial ? `social_${category}_click` : 'navigation_click';
    win.gtag('event', eventName, { link_category: category, ...context() });
  }

  // Registered before either SDK; a sensitive focus prevents resuming until navigation.
  doc.addEventListener?.('focus', sensitiveFocus, true);
  doc.addEventListener?.('focusin', sensitiveFocus, true);
  sensitiveFocus({ target: doc.activeElement });
  queueDefaults();
  refresh();
  return { choose, refresh, pageView, click, revoke: () => choose('refused'), state: () => current()?.choice ?? null };
}

export function mountAnalyticsConsent(win = window, doc = document) {
  const root = doc.querySelector('[data-analytics-consent-root]');
  if (!root || root.dataset.initialized) return;
  root.dataset.initialized = 'true';
  const panel = root.querySelector('[data-consent-panel]');
  const settings = root.querySelector('[data-consent-settings]');
  const revoke = root.querySelector('[data-consent-revoke]');
  const controller = createAnalyticsConsent({ window: win, document: doc, onState: state => {
    panel.hidden = state !== null;
    settings.setAttribute('aria-expanded', String(!panel.hidden));
    revoke.hidden = state !== 'accepted';
  } });
  root.querySelector('[data-consent-accept]').addEventListener('click', () => controller.choose('accepted'));
  root.querySelector('[data-consent-refuse]').addEventListener('click', () => controller.choose('refused'));
  revoke.addEventListener('click', controller.revoke);
  settings.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    settings.setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) root.querySelector('[data-consent-refuse]').focus();
  });
  doc.addEventListener('click', event => {
    const link = event.target?.closest?.('a[href]');
    if (link) controller.click(link.href);
  });
  win.addEventListener('storage', event => { if (event.key === CONSENT_KEY || event.key === null) controller.refresh(); });
  doc.addEventListener('visibilitychange', () => { if (doc.visibilityState === 'visible') controller.refresh(); });
  doc.addEventListener('astro:page-load', controller.refresh);
  return controller;
}
