import test from 'node:test';
import assert from 'node:assert/strict';
import { SHORT_LINK_CHANNELS, SHORT_LINK_SLUGS, SHORT_LINK_TARGET, shortLinkPath } from '../src/data/short-links.js';
import { redirectShortLink, mountShortLink, REDIRECT_TIMEOUT_MS } from '../src/scripts/short-link.js';
import { createAnalyticsConsent, sixMonthsFrom, CONSENT_KEY, CONSENT_VERSION, GA_ID } from '../src/scripts/analytics-consent.js';

const TARGET = 'https://github.com/stoa-platform/stoa';
const EXPECTED_SLUGS = [
  'x-post', 'x-comment', 'x-bio',
  'linkedin-post', 'linkedin-comment', 'linkedin-bio',
  'hn-post', 'hn-comment', 'hn-bio',
  'devto-post', 'devto-comment', 'devto-bio',
  'github-discussions-post', 'github-discussions-comment', 'github-discussions-bio',
  'reddit-post', 'reddit-comment',
  'reddit-mcp-post', 'reddit-mcp-comment',
  'reddit-claudeai-post', 'reddit-claudeai-comment',
  'reddit-selfhosted-post', 'reddit-selfhosted-comment',
  'github-bio',
];
const NOW = Date.UTC(2026, 10, 23, 12);
const DISABLE_KEY = `ga-disable-${GA_ID}`;

const consent = (choice, chosenAt = NOW - 3_600_000) => JSON.stringify({
  version: CONSENT_VERSION, choice, chosenAt, expiresAt: sixMonthsFrom(chosenAt),
});

function browser({ saved = null, readFails = false, href = 'https://gostoa.dev/r/x-post', referrer = 'https://www.reddit.com/', slug = 'x-post' } = {}) {
  let stored = saved;
  let timerId = 0;
  const nodes = [];
  const timers = new Map();
  const replaced = [];
  const location = new URL(href);
  location.replace = url => replaced.push(url);
  const win = {
    location,
    localStorage: {
      getItem: key => { assert.equal(key, CONSENT_KEY); if (readFails) throw Error('storage unavailable'); return stored; },
      setItem: () => { throw Error('the redirect never writes a choice'); },
    },
    setTimeout: (callback, delay) => { timers.set(++timerId, { callback, delay }); return timerId; },
    clearTimeout: id => timers.delete(id),
  };
  const doc = {
    title: 'Redirecting to STOA on GitHub',
    referrer,
    cookie: '',
    documentElement: { dataset: { shortLink: slug } },
    head: { appendChild: node => nodes.push(node) },
    createElement: tag => { assert.equal(tag, 'script'); return { remove() { this.removed = true; } }; },
    addEventListener: () => {},
  };
  return { win, doc, nodes, timers, replaced,
    commands: () => (win.dataLayer ?? []).map(command => Array.from(command)),
    events: () => (win.dataLayer ?? []).map(command => Array.from(command)).filter(c => c[0] === 'event'),
    setStored: value => { stored = value; },
    fireTimers: () => [...timers.values()].forEach(timer => timer.callback()),
  };
}

function run(options = {}) {
  const b = browser(options);
  const slug = 'slug' in options ? options.slug : 'x-post';
  redirectShortLink({ window: b.win, document: b.doc, slug, now: () => NOW });
  return b;
}

test('the data module defines exactly the 24 channel slugs and one target', () => {
  assert.deepEqual(SHORT_LINK_SLUGS, EXPECTED_SLUGS);
  assert.equal(SHORT_LINK_SLUGS.length, 24);
  assert.equal(new Set(SHORT_LINK_SLUGS).size, 24);
  for (const slug of SHORT_LINK_SLUGS) assert.match(slug, /^[a-z0-9-]+$/);
  assert.ok(!SHORT_LINK_SLUGS.some(slug => /^reddit.*-bio$/.test(slug)));
  assert.equal(SHORT_LINK_TARGET, TARGET);
  assert.equal(shortLinkPath('x-post'), '/r/x-post');
});

test('slugs are generated from channels and types', () => {
  const generated = Object.entries(SHORT_LINK_CHANNELS).flatMap(([channel, types]) => types.map(type => `${channel}-${type}`));
  assert.deepEqual(SHORT_LINK_SLUGS, generated);
  const withBio = Object.keys(SHORT_LINK_CHANNELS).filter(channel => SHORT_LINK_CHANNELS[channel].includes('bio'));
  assert.deepEqual(withBio, ['x', 'linkedin', 'hn', 'devto', 'github-discussions', 'github']);
  assert.deepEqual(SHORT_LINK_CHANNELS.github, ['bio']);
  for (const channel of ['reddit', 'reddit-mcp', 'reddit-claudeai', 'reddit-selfhosted']) {
    assert.deepEqual(SHORT_LINK_CHANNELS[channel], ['post', 'comment']);
  }
});

test('accepted consent loads Google, sends one page view, then redirects on its callback', () => {
  const b = run({ saved: consent('accepted') });
  assert.equal(b.nodes.length, 1);
  assert.equal(b.nodes[0].src, `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`);
  assert.equal(b.nodes[0].referrerPolicy, 'origin');
  assert.equal(b.win[DISABLE_KEY], false);
  assert.deepEqual(b.commands(), [['consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' }]]);
  assert.deepEqual(b.replaced, [], 'waits for the library');
  assert.deepEqual([...b.timers.values()].map(timer => timer.delay), [REDIRECT_TIMEOUT_MS]);

  b.nodes[0].onload();
  const commands = b.commands();
  assert.deepEqual(commands.map(c => c[0] + ':' + c[1]).slice(0, 4), ['consent:default', 'consent:update', 'set:ads_data_redaction', 'set:url_passthrough']);
  assert.deepEqual(commands[1][2], { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  const config = commands.find(c => c[0] === 'config');
  assert.equal(config[1], GA_ID);
  assert.equal(config[2].send_page_view, false);
  assert.equal(config[2].allow_google_signals, false);
  assert.equal(config[2].allow_ad_personalization_signals, false);
  assert.equal(config[2].page_location, 'https://gostoa.dev/r/x-post');
  assert.equal(config[2].page_referrer, 'https://www.reddit.com/');

  const events = commands.filter(c => c[0] === 'event');
  assert.equal(events.length, 1);
  assert.equal(events[0][1], 'page_view');
  assert.ok(commands.indexOf(config) < commands.indexOf(events[0]), 'configured before the page view');
  const { event_callback: callback, ...values } = events[0][2];
  assert.deepEqual(values, {
    site_section: 'marketing',
    page_location: 'https://gostoa.dev/r/x-post',
    page_referrer: 'https://www.reddit.com/',
    page_title: 'Redirecting to STOA on GitHub',
  });
  assert.deepEqual(b.replaced, [], 'the page view is queued before leaving');

  callback();
  assert.deepEqual(b.replaced, [TARGET]);
  assert.equal(b.timers.size, 0, 'the timeout is cancelled');
  callback(); b.fireTimers();
  assert.deepEqual(b.replaced, [TARGET], 'one redirect only');
  assert.equal(b.events().length, 1);
  assert.equal(b.win[DISABLE_KEY], false);
});

test('the Google setup is the one a site page sends after Accept', () => {
  const href = 'https://gostoa.dev/r/x-post';
  const referrer = 'https://www.reddit.com/';
  const link = run({ saved: consent('accepted'), href, referrer });
  link.nodes[0].onload();

  const site = browser({ saved: consent('accepted'), href, referrer });
  createAnalyticsConsent({ window: site.win, document: site.doc, now: () => NOW, clarityId: '' });
  site.nodes[0].onload();

  for (const key of ['src', 'id', 'async', 'referrerPolicy']) assert.equal(link.nodes[0][key], site.nodes[0][key], key);
  const withoutCallback = commands => commands.map(c => {
    if (c[0] !== 'event') return c;
    const { event_callback: _, ...values } = c[2];
    return [c[0], c[1], values];
  });
  assert.deepEqual(withoutCallback(link.commands()), withoutCallback(site.commands()));
});

test('the hard timeout redirects when Google does not answer in time', () => {
  assert.ok(REDIRECT_TIMEOUT_MS <= 800);

  const slow = run({ saved: consent('accepted') });
  slow.fireTimers();
  assert.deepEqual(slow.replaced, [TARGET]);
  assert.equal(slow.win[DISABLE_KEY], true, 'a late library stays silent');
  slow.nodes[0].onload();
  assert.equal(slow.events().length, 0, 'nothing is sent after leaving');
  assert.deepEqual(slow.replaced, [TARGET]);

  const noCallback = run({ saved: consent('accepted') });
  noCallback.nodes[0].onload();
  assert.equal(noCallback.events().length, 1);
  assert.deepEqual(noCallback.replaced, []);
  noCallback.fireTimers();
  assert.deepEqual(noCallback.replaced, [TARGET]);
  noCallback.events()[0][2].event_callback();
  assert.deepEqual(noCallback.replaced, [TARGET]);
});

test('a blocked or failing Google script redirects at once without an event', () => {
  const b = run({ saved: consent('accepted') });
  b.nodes[0].onerror();
  assert.deepEqual(b.replaced, [TARGET]);
  assert.equal(b.events().length, 0);
  assert.equal(b.timers.size, 0);
  assert.equal(b.win[DISABLE_KEY], true);
});

test('refused, missing, invalid or expired consent redirects immediately and loads nothing', () => {
  const expired = NOW - 200 * 86_400_000;
  const future = NOW + 3_600_000;
  const oldVersion = JSON.parse(consent('accepted')); oldVersion.version = CONSENT_VERSION - 1;
  const longer = JSON.parse(consent('accepted')); longer.expiresAt += 86_400_000;
  const cases = {
    refused: { saved: consent('refused') },
    missing: { saved: null },
    'empty string': { saved: '' },
    'bad JSON': { saved: 'accepted' },
    'empty object': { saved: '{}' },
    'unknown choice': { saved: consent('granted') },
    expired: { saved: consent('accepted', expired) },
    'chosen in the future': { saved: consent('accepted', future) },
    'previous receipt version': { saved: JSON.stringify(oldVersion) },
    'altered expiry': { saved: JSON.stringify(longer) },
    'storage unavailable': { saved: consent('accepted'), readFails: true },
  };
  for (const [name, options] of Object.entries(cases)) {
    const b = run(options);
    assert.deepEqual(b.replaced, [TARGET], name);
    assert.equal(b.nodes.length, 0, name);
    assert.equal(b.win.dataLayer, undefined, name);
    assert.equal(b.win.gtag, undefined, name);
    assert.equal(b.timers.size, 0, name);
    assert.equal(b.win[DISABLE_KEY], true, name);
  }
});

test('a withdrawal while the library downloads sends nothing', () => {
  const b = run({ saved: consent('accepted') });
  b.setStored(consent('refused'));
  b.nodes[0].onload();
  assert.equal(b.events().length, 0);
  assert.ok(!b.commands().some(c => c[0] === 'config'));
  assert.deepEqual(b.replaced, [TARGET]);
  assert.equal(b.win[DISABLE_KEY], true);
});

test('the incoming query string, fragment and referring path never reach Google or GitHub', () => {
  for (const path of ['/r/x-post', '/r/x-post/', '/r/x-post/index.html']) {
    const b = run({
      saved: consent('accepted'),
      href: `https://gostoa.dev${path}?utm_source=x&utm_medium=social&utm_campaign=stoa&email=private-value#private-fragment`,
      referrer: 'https://forum.example.com/private-thread/42?share=private-id#private-reply',
    });
    b.nodes[0].onload();
    const sent = JSON.stringify(b.commands());
    assert.ok(!sent.includes('private-'), path);
    assert.ok(!sent.includes('utm_') && !sent.includes('campaign_'), path);
    const [, , values] = b.events()[0];
    assert.equal(values.page_location, 'https://gostoa.dev/r/x-post', path);
    assert.equal(values.page_referrer, 'https://forum.example.com/', path);
    values.event_callback();
    assert.deepEqual(b.replaced, [TARGET], path);
  }

  for (const referrer of ['', 'android-app://com.example.app/', 'not a URL']) {
    const b = run({ saved: consent('accepted'), referrer });
    b.nodes[0].onload();
    assert.equal(b.events()[0][2].page_referrer, '', referrer);
  }

  const refused = run({ saved: consent('refused'), href: 'https://gostoa.dev/r/x-post?next=https://example.com/#private-fragment' });
  assert.deepEqual(refused.replaced, [TARGET]);
});

test('every slug measures its own path', () => {
  for (const slug of EXPECTED_SLUGS) {
    const b = run({ saved: consent('accepted'), slug, href: `https://gostoa.dev/r/${slug}` });
    b.nodes[0].onload();
    assert.equal(b.events().length, 1, slug);
    assert.equal(b.events()[0][2].page_location, `https://gostoa.dev/r/${slug}`, slug);
  }
});

test('an unknown slug redirects without measuring', () => {
  for (const slug of [undefined, '', 'reddit-bio', 'x-post/../x-bio', 'X-POST']) {
    const b = run({ saved: consent('accepted'), slug });
    assert.deepEqual(b.replaced, [TARGET], String(slug));
    assert.equal(b.nodes.length, 0, String(slug));
  }
});

test('localhost, preview and HTTP origins redirect without loading Google after acceptance', () => {
  for (const href of ['http://localhost:4321/r/x-post', 'http://127.0.0.1:4321/r/x-post', 'https://stoa-preview.vercel.app/r/x-post', 'http://gostoa.dev/r/x-post']) {
    const b = run({ saved: consent('accepted'), href });
    assert.deepEqual(b.replaced, [TARGET], href);
    assert.equal(b.nodes.length, 0, href);
    assert.equal(b.win.dataLayer, undefined, href);
  }
});

test('Clarity is never loaded or called', () => {
  const b = run({ saved: consent('accepted'), referrer: '' });
  b.nodes[0].onload();
  b.events()[0][2].event_callback();
  assert.equal(b.nodes.length, 1);
  assert.ok(b.nodes.every(node => !/clarity/i.test(node.src) && !/clarity/i.test(node.id)));
  assert.equal(b.win.clarity, undefined);
});

test('the page script reads its slug from the document', () => {
  const b = browser({ saved: consent('refused'), slug: 'hn-comment' });
  mountShortLink(b.win, b.doc);
  assert.deepEqual(b.replaced, [TARGET]);

  // The real clock is used here, so the receipt must be valid today.
  const accepted = browser({ saved: consent('accepted', Date.now() - 60_000), slug: 'hn-comment', href: 'https://gostoa.dev/r/hn-comment/' });
  mountShortLink(accepted.win, accepted.doc);
  accepted.nodes[0].onload();
  assert.equal(accepted.events()[0][2].page_location, 'https://gostoa.dev/r/hn-comment');
});
