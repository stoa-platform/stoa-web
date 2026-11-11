import test from 'node:test';
import assert from 'node:assert/strict';
import { createAnalyticsConsent, parseConsent, cleanUrl, linkCategory, sixMonthsFrom, CONSENT_KEY, CONSENT_VERSION, GA_ID } from '../src/scripts/analytics-consent.js';

function harness({ saved = null, readFails = false, writeFails = false, href = 'https://gostoa.dev/fr/?private_query=private-value#private-fragment', referrer = 'https://example.com/source?email=private-referrer#private-section', clarityId = '' } = {}) {
  let clock = Date.UTC(2026, 10, 10, 12);
  let stored = saved;
  let reloads = 0;
  const nodes = [];
  const timers = new Map();
  let timerId = 0;
  const cookieDeletes = [];
  const masked = [];
  const listeners = {};
  const location = new URL(href);
  location.reload = () => reloads++;
  const win = {
    location,
    localStorage: {
      getItem: key => { assert.equal(key, CONSENT_KEY); if (readFails) throw Error('storage unavailable'); return stored; },
      setItem: (key, value) => { assert.equal(key, CONSENT_KEY); if (writeFails) throw Error('storage unavailable'); stored = value; },
    },
    setTimeout: (callback, delay) => { timers.set(++timerId, { callback, delay }); return timerId; },
    clearTimeout: id => timers.delete(id),
  };
  const doc = {
    body: { setAttribute: (...args) => masked.push(['body', ...args]) },
    title: 'STOA Platform',
    referrer,
    get cookie() { return '_ga=known-id; _ga_TEST=known-session; _clck=known-id; _clsk=known-session; essential=keep'; },
    set cookie(value) { cookieDeletes.push(value); },
    head: { appendChild: node => nodes.push(node) },
    createElement: tag => { assert.equal(tag, 'script'); return { remove() { this.removed = true; } }; },
    querySelectorAll: () => [{ setAttribute: (...args) => masked.push(args) }],
    addEventListener: (name, handler, capture) => { listeners[name] = { handler, capture }; },
  };
  const states = [];
  const controller = createAnalyticsConsent({ window: win, document: doc, now: () => clock, onState: state => states.push(state), clarityId });
  return { win, doc, nodes, states, timers, cookieDeletes, controller, masked, listeners,
    commands: () => win.dataLayer.map(command => Array.from(command)),
    tick: value => { clock = value; }, setStored: value => { stored = value; },
    stored: () => stored, reloads: () => reloads,
  };
}

const consent = (choice, chosenAt = Date.UTC(2026, 10, 10, 10)) => JSON.stringify({
  version: CONSENT_VERSION, choice, chosenAt, expiresAt: sixMonthsFrom(chosenAt),
});

test('no Google request or event without consent or after refusal', () => {
  const h = harness();
  assert.equal(h.nodes.length, 0);
  assert.equal(h.win[`ga-disable-${GA_ID}`], true);
  h.controller.pageView(); h.controller.click('https://docs.gostoa.dev/');
  assert.equal(h.nodes.length, 0);
  h.controller.choose('refused');
  assert.equal(h.nodes.length, 0);
  assert.equal(JSON.parse(h.stored()).choice, 'refused');
  assert.equal(h.commands().length, 0);
  assert.equal(h.reloads(), 0);
});

test('a grant loads one tag then sends one cleaned page and no advertising consent', () => {
  const h = harness(); h.controller.choose('accepted');
  assert.equal(h.nodes.length, 1);
  assert.match(h.nodes[0].src, /^https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-8PL054C7RH$/);
  assert.ok(!h.commands().some(c => c[0] === 'event'), 'no event before library load');
  h.nodes[0].onload();
  h.controller.refresh(); h.controller.pageView();
  assert.equal(h.nodes.length, 1);
  const commands = h.commands();
  const config = commands.find(c => c[0] === 'config')[2];
  assert.equal(config.send_page_view, false);
  assert.equal(config.allow_google_signals, false);
  assert.equal(config.allow_ad_personalization_signals, false);
  const grant = commands.find(c => c[0] === 'consent' && c[1] === 'update')[2];
  assert.deepEqual(grant, { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  const events = commands.filter(c => c[0] === 'event');
  assert.equal(events.length, 1);
  assert.equal(events[0][1], 'page_view');
  assert.equal(events[0][2].site_section, 'marketing');
  assert.equal(events[0][2].page_location, 'https://gostoa.dev/fr/');
  assert.equal(events[0][2].page_referrer, 'https://example.com/source');
  assert.ok(!JSON.stringify(commands).includes('private-'));
});

test('social UTM attribution is limited to the approved campaign fields after consent', () => {
  const href = 'https://gostoa.dev/fr/?utm_source=linkedin&utm_medium=social&utm_campaign=stoa&utm_content=company_profile&private_query=private-value#private-fragment';
  const h = harness({ href, clarityId: 'testproject123' });
  assert.equal(h.nodes.length, 0);
  h.controller.choose('accepted');
  assert.equal(h.nodes.length, 1, 'Clarity still skips a URL with query or fragment values');
  h.nodes[0].onload();

  const commands = h.commands();
  const configIndex = commands.findIndex(c => c[0] === 'config');
  const pageViewIndex = commands.findIndex(c => c[0] === 'event' && c[1] === 'page_view');
  assert.ok(configIndex >= 0 && configIndex < pageViewIndex);
  const config = commands[configIndex][2];
  assert.equal(config.campaign_source, 'linkedin');
  assert.equal(config.campaign_medium, 'social');
  assert.equal(config.campaign_name, 'stoa');
  assert.equal(config.campaign_content, 'company_profile');
  assert.equal(config.page_location, 'https://gostoa.dev/fr/');
  assert.equal(config.page_referrer, 'https://example.com/source');
  assert.ok(!JSON.stringify(commands).includes('private-'));

  const noContent = harness({ href: 'https://gostoa.dev/?utm_source=x&utm_medium=social&utm_campaign=stoa&utm_content=private-value', saved: consent('accepted') });
  noContent.nodes[0].onload();
  const noContentConfig = noContent.commands().find(c => c[0] === 'config')[2];
  assert.equal(noContentConfig.campaign_source, 'x');
  assert.equal(noContentConfig.campaign_content, undefined);
  assert.ok(!JSON.stringify(noContent.commands()).includes('private-'));

  for (const query of [
    'utm_source=private-value&utm_medium=social&utm_campaign=stoa',
    'utm_source=linkedin&utm_medium=email&utm_campaign=stoa',
    'utm_source=linkedin&utm_medium=social&utm_campaign=private-value',
    'utm_source=linkedin&utm_source=x&utm_medium=social&utm_campaign=stoa',
    'utm_source=linkedin&utm_campaign=stoa',
  ]) {
    const invalid = harness({ href: 'https://gostoa.dev/?' + query, saved: consent('accepted') });
    invalid.nodes[0].onload();
    const config = invalid.commands().find(c => c[0] === 'config')[2];
    assert.ok(Object.keys(config).every(key => !key.startsWith('campaign_')));
    assert.ok(!JSON.stringify(invalid.commands()).includes('private-'));
  }
});

test('only exact approved social destinations produce a value-free click after consent', () => {
  const destinations = [
    'https://www.linkedin.com/company/10041472/',
    'https://www.linkedin.com/in/christophe-aboulicam/',
    'https://x.com/caboulicam',
  ];
  const h = harness();
  destinations.forEach(h.controller.click);
  assert.equal(h.commands().length, 0);
  h.controller.choose('accepted');
  destinations.forEach(h.controller.click);
  assert.ok(!h.commands().some(c => c[0] === 'event'));
  h.nodes[0].onload();
  destinations.forEach(h.controller.click);
  [
    destinations[0] + '?private=private-value',
    'https://www.linkedin.com/company/another-company/',
    'https://x.com/caboulicam/status/123',
    'https://x.com.evil.example/caboulicam',
  ].forEach(h.controller.click);
  const events = h.commands().filter(c => c[0] === 'event' && c[1] !== 'page_view');
  assert.deepEqual(events.map(c => c[1]), ['social_linkedin_company_click', 'social_linkedin_profile_click', 'social_x_profile_click']);
  assert.deepEqual(events.map(c => c[2].link_category), ['linkedin_company', 'linkedin_profile', 'x_profile']);
  assert.ok(events.every(c => !('link_url' in c[2]) && !('link_text' in c[2])));
  assert.ok(destinations.every(href => !JSON.stringify(events).includes(href)));
  assert.ok(!JSON.stringify(events).includes('private-'));
  h.controller.revoke();
  destinations.forEach(h.controller.click);
  assert.equal(h.commands().length, 0);
});

test('persisted choices remain independent and are limited to six calendar months', () => {
  const h = harness({ saved: consent('accepted') });
  assert.equal(h.nodes.length, 1);
  const refused = harness({ saved: consent('refused') });
  assert.equal(refused.nodes.length, 0);
  const jan31 = Date.UTC(2026, 7, 31, 12);
  assert.equal(sixMonthsFrom(jan31), Date.UTC(2027, 1, 28, 12));
  assert.equal(parseConsent(consent('accepted'), Date.UTC(2027, 4, 10, 10)), null);
  for (const value of ['bad JSON', '{}', 'null', JSON.stringify({ version: CONSENT_VERSION + 1, choice: 'accepted' }), consent('unknown')]) {
    assert.equal(harness({ saved: value }).nodes.length, 0, value);
  }
});

test('withdrawal cancels a pending load without any queued analytics event', () => {
  const h = harness(); h.controller.choose('accepted');
  const pending = h.nodes[0]; h.controller.revoke(); pending.onload();
  assert.equal(h.controller.state(), 'refused');
  assert.equal(h.win[`ga-disable-${GA_ID}`], true);
  assert.equal(pending.removed, true);
  assert.equal(h.commands().length, 0);
  assert.equal(h.reloads(), 1);
});

test('withdrawal after loading stops sends and clears only analytics cookies', () => {
  const h = harness(); h.controller.choose('accepted'); h.nodes[0].onload();
  h.controller.revoke(); h.controller.click('mailto:hello@gostoa.dev?body=private-message');
  h.controller.pageView();
  assert.equal(h.commands().length, 0);
  assert.equal(h.win[`ga-disable-${GA_ID}`], true);
  assert.equal(h.reloads(), 1);
  assert.ok(h.cookieDeletes.some(c => c.startsWith('_ga=')));
  assert.ok(h.cookieDeletes.every(c => !c.startsWith('essential=')));
});

test('expiry and a cross-tab refusal stop a loaded tag', () => {
  for (const reason of ['expiry', 'storage']) {
    const h = harness(); h.controller.choose('accepted'); h.nodes[0].onload();
    if (reason === 'expiry') h.tick(JSON.parse(h.stored()).expiresAt);
    else h.setStored(consent('refused'));
    h.controller.refresh(); h.controller.click('https://docs.gostoa.dev/');
    assert.equal(h.commands().length, 0, reason);
    assert.equal(h.win[`ga-disable-${GA_ID}`], true, reason);
    assert.equal(h.reloads(), 1, reason);
  }
});

test('query and fragment changes do not add page views; A to B to A is measured', () => {
  const h = harness(); h.controller.choose('accepted'); h.nodes[0].onload();
  h.win.location.href = 'https://gostoa.dev/fr/?different=value#other'; h.controller.pageView();
  h.win.location.href = 'https://gostoa.dev/fr/pricing/?token=private'; h.controller.pageView();
  h.win.location.href = 'https://gostoa.dev/fr/'; h.controller.pageView();
  assert.equal(h.commands().filter(c => c[0] === 'event' && c[1] === 'page_view').length, 3);
});

test('only approved click categories are emitted, without the destination or form content', () => {
  const h = harness(); h.controller.choose('accepted'); h.nodes[0].onload();
  for (const href of [
    'https://docs.gostoa.dev/docs/guides/quickstart?secret=private-value#anchor',
    'https://docs.gostoa.dev/docs/reference/api?secret=private-value',
    'mailto:demo@gostoa.dev?subject=private-subject&body=private-form',
    '/fr/demo/?private=1',
    'https://github.com/stoa-platform/stoa-quickstart?private=1',
    'https://unrelated.example.com/', 'mailto:privacy@gostoa.dev', '/pricing/',
  ]) h.controller.click(href);
  const events = h.commands().filter(c => c[1] === 'navigation_click');
  assert.deepEqual(events.map(c => c[2].link_category), ['quickstart', 'docs', 'contact', 'contact', 'quickstart']);
  assert.ok(events.every(c => !('link_url' in c[2]) && !('link_text' in c[2])));
  assert.ok(events.every(c => c[2].site_section === 'marketing'));
  assert.ok(!JSON.stringify(events).includes('private-'));
});

test('storage failures permit an explicit current-page grant without assuming consent later', () => {
  for (const options of [{ readFails: true, writeFails: true }, { writeFails: true }]) {
    const h = harness(options); assert.equal(h.nodes.length, 0);
    h.controller.choose('accepted'); assert.equal(h.nodes.length, 1); h.nodes[0].onload();
    assert.equal(h.commands().filter(c => c[1] === 'page_view').length, 1);
    h.controller.revoke(); assert.equal(h.commands().length, 0);
  }
});

test('bad and non-web referrers never enter analytics context; categories use exact hosts', () => {
  assert.equal(cleanUrl('mailto:user@example.com?body=private'), '');
  assert.equal(cleanUrl('not a URL'), '');
  assert.equal(cleanUrl('https://example.com/path?token=secret#frag'), 'https://example.com/path');
  assert.equal(linkCategory('https://docs.gostoa.dev.evil.example/path', 'https://gostoa.dev/'), null);
  assert.equal(linkCategory('https://github.com/stoa-platform/stoa-quickstart-evil', 'https://gostoa.dev/'), null);
});

test('localhost, preview and HTTP origins never load Google after accepting', () => {
  for (const href of ['http://127.0.0.1:8848/', 'http://localhost:8848/', 'https://stoa-preview.vercel.app/', 'http://gostoa.dev/']) {
    const h = harness({ href, clarityId: 'testproject123' });
    h.controller.choose('accepted'); h.controller.pageView(); h.controller.click('https://docs.gostoa.dev/');
    assert.equal(h.controller.state(), 'accepted', href);
    assert.equal(h.nodes.length, 0, href);
    assert.equal(h.win[`ga-disable-${GA_ID}`], true, href);
    assert.ok(!h.commands().some(c => c[0] === 'event'), href);
  }
});

test('local and preview choices never remove analytics cookies belonging to other projects', () => {
  for (const href of ['http://localhost:8848/', 'http://127.0.0.1:8848/', 'https://preview.vercel.app/', 'http://gostoa.dev/']) {
    const h = harness({ href, clarityId: 'testproject123' });
    h.controller.choose('accepted'); h.controller.revoke(); h.controller.refresh();
    assert.deepEqual(h.cookieDeletes, [], href);
  }
});

test('the previous Google-only receipt cannot grant the new combined consent', () => {
  const saved = JSON.parse(consent('accepted')); saved.version = 1;
  assert.equal(harness({ saved: JSON.stringify(saved), clarityId: 'testproject123' }).nodes.length, 0);
  assert.ok(CONSENT_KEY.endsWith('.v2'));
});

test('Clarity remains off when the project ID is absent, even after consent', () => {
  const h = harness(); h.controller.choose('accepted');
  assert.equal(h.nodes.length, 1);
  assert.ok(h.nodes.every(node => !node.src.includes('clarity.ms')));
});

test('Clarity loads only after consent, masks forms and denies advertising storage', () => {
  const refused = harness({ clarityId: 'testproject123' }); refused.controller.choose('refused');
  assert.equal(refused.nodes.length, 0);
  const h = harness({ clarityId: 'testproject123', href: 'https://gostoa.dev/', referrer: '' });
  assert.equal(h.nodes.length, 0);
  h.controller.choose('accepted');
  const node = h.nodes.find(node => node.id === 'stoa-microsoft-clarity');
  assert.equal(node.src, 'https://www.clarity.ms/tag/testproject123');
  assert.equal(h.nodes.length, 2);
  assert.deepEqual(h.masked, [['body', 'data-clarity-mask', 'true'], ['data-clarity-mask', 'true']]);
  const commands = h.win.clarity.q.map(args => Array.from(args));
  assert.deepEqual(commands[0], ['consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' }]);
  assert.deepEqual(commands[1], ['set', 'site_section', 'marketing']);
  assert.ok(commands.every(command => command[0] !== 'identify'));
});

test('Clarity withdrawal stops capture, purges cookies and cancels a pending load', () => {
  const h = harness({ clarityId: 'testproject123', href: 'https://gostoa.dev/', referrer: '' }); h.controller.choose('accepted');
  const node = h.nodes.find(node => node.id === 'stoa-microsoft-clarity');
  const calls = []; h.win.clarity = (...args) => calls.push(args);
  h.controller.revoke(); node.onload();
  assert.deepEqual(calls, [['stop']]);
  assert.ok(node.removed);
  assert.equal(h.reloads(), 1);
  assert.ok(h.cookieDeletes.some(cookie => cookie.startsWith('_clck=')));
  assert.ok(h.cookieDeletes.some(cookie => cookie.startsWith('_clsk=')));
  assert.ok(h.cookieDeletes.some(cookie => cookie.includes('domain=.gostoa.dev')));
});

test('Clarity is excluded for a document with query or fragment context while Google remains available', () => {
  const h = harness({ clarityId: 'testproject123' }); h.controller.choose('accepted');
  assert.equal(h.nodes.length, 1);
  assert.ok(h.nodes[0].src.includes('googletagmanager'));
});

test('sensitive focus stops Clarity and the controller does not reload it in this document', () => {
  const h = harness({ clarityId: 'testproject123', href: 'https://gostoa.dev/', referrer: '' });
  h.controller.choose('accepted');
  const google = h.nodes.find(node => node.id === 'stoa-google-analytics'); google.onload();
  const clarity = h.nodes.find(node => node.id === 'stoa-microsoft-clarity');
  const calls = []; h.win.clarity = (...args) => calls.push(args);
  assert.equal(h.listeners.focus.capture, true);
  assert.equal(h.listeners.focusin.capture, true);
  h.listeners.focus.handler({ target: { closest: () => ({ tagName: 'INPUT' }) } });
  assert.deepEqual(calls, [['stop']]); assert.ok(clarity.removed);
  clarity.onload(); h.controller.refresh();
  assert.equal(h.nodes.length, 2, 'no replacement Clarity script');
  h.controller.click('mailto:demo@gostoa.dev?body=private-message');
  assert.ok(h.commands().some(c => c[1] === 'navigation_click'));
  assert.equal(h.win[`ga-disable-${GA_ID}`], false);
  assert.equal(h.reloads(), 0, 'do not interrupt the form');
});
