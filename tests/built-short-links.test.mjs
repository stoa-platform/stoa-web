import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import vm from 'node:vm';
import { SHORT_LINK_SLUGS } from '../src/data/short-links.js';
import { sixMonthsFrom, CONSENT_KEY, CONSENT_VERSION, GA_ID } from '../src/scripts/analytics-consent.js';

const TARGET = 'https://github.com/stoa-platform/stoa';

// Runs the script exactly as it ships in the page, against an in-memory browser substitute.
function runBuiltScript(html, { saved = null, href, referrer = '' }) {
  const [, code] = html.match(/<script type="module">([\s\S]*?)<\/script>/);
  assert.doesNotMatch(code, /\b(?:import|export)\b/, 'the page script is self-contained');
  const nodes = [];
  const timers = [];
  const replaced = [];
  const location = new URL(href);
  location.replace = url => replaced.push(url);
  const window = {
    location,
    localStorage: { getItem: key => { assert.equal(key, CONSENT_KEY); return saved; } },
    setTimeout: (callback, delay) => timers.push({ callback, delay }),
    clearTimeout: () => {},
  };
  const document = {
    title: html.match(/<title>([^<]*)<\/title>/)[1],
    referrer,
    documentElement: { dataset: { shortLink: html.match(/data-short-link="([^"]+)"/)[1] } },
    head: { appendChild: node => nodes.push(node) },
    createElement: () => ({}),
  };
  vm.runInNewContext(code, { window, document, URL });
  return { window, nodes, timers, replaced,
    commands: () => Array.from(window.dataLayer ?? [], command => Array.from(command)),
  };
}

test('each of the 24 short links is built as a noindex page pointing at the target', async () => {
  const built = (await readdir(join('dist', 'r'), { withFileTypes: true }))
    .filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
  assert.equal(built.length, 24);
  assert.deepEqual(built, [...SHORT_LINK_SLUGS].sort());

  for (const slug of SHORT_LINK_SLUGS) {
    const path = join('dist', 'r', slug, 'index.html');
    const html = await readFile(path, 'utf8');
    assert.ok(html.includes('<meta name="robots" content="noindex, nofollow">'), `${path}: noindex`);
    assert.ok(!/rel=["']canonical/i.test(html), `${path}: no canonical`);
    assert.ok(html.includes(`data-short-link="${slug}"`), `${path}: slug`);
    assert.ok(html.includes('Redirecting to STOA on GitHub'), `${path}: text`);
    assert.ok(html.includes(`<a href="${TARGET}">${TARGET}</a>`), `${path}: visible link`);
    assert.ok(html.includes(`<noscript><meta http-equiv="refresh" content="0; url=${TARGET}"></noscript>`), `${path}: noscript fallback`);
    assert.equal((html.match(/http-equiv/gi) || []).length, 1, `${path}: refresh only inside noscript`);
    const github = html.match(/https:\/\/github\.com[^"'`<\s]*/g) || [];
    assert.ok(github.length >= 3 && github.every(url => url === TARGET), `${path}: one exact target`);
  }
});

test('short-link pages carry no consent control, no Clarity and no eager or external script', async () => {
  for (const slug of SHORT_LINK_SLUGS) {
    const path = join('dist', 'r', slug, 'index.html');
    const html = await readFile(path, 'utf8');
    assert.ok(!/clarity/i.test(html), `${path}: Clarity reference`);
    assert.ok(!/data-(?:analytics-)?consent-/.test(html), `${path}: consent control`);
    // The redirect must not wait for, or depend on, another file.
    assert.equal((html.match(/<script\b/g) || []).length, 1, `${path}: one script`);
    assert.ok(!/<script[^>]*\bsrc=/i.test(html), `${path}: external script`);
    assert.ok(!html.includes('/_astro/'), `${path}: bundled asset`);
    assert.ok(html.includes('location.replace('), `${path}: scripted redirect`);
    assert.ok(!/<link[^>]+rel=["'](?:preconnect|preload|modulepreload|dns-prefetch|stylesheet)/i.test(html), `${path}: eager resource`);
    // An origin-only referrer policy is set before any resource or redirect.
    const policy = html.match(/<meta[^>]+name=["']referrer["'][^>]*content=["']([^"']+)["']/i);
    assert.equal(policy?.[1], 'origin', `${path}: origin-only referrer policy`);
    assert.ok(html.indexOf('name="referrer"') < html.search(/<link\b|<script\b|http-equiv/i), `${path}: policy comes first`);
    assert.ok(!/no-?referrer/i.test(html), `${path}: referrer removed`);
  }
});

test('the script built into the page redirects on its own and measures only with consent', async () => {
  const slug = 'reddit-mcp-comment';
  const html = await readFile(join('dist', 'r', slug, 'index.html'), 'utf8');
  const chosenAt = Date.now() - 60_000;
  const receipt = choice => JSON.stringify({ version: CONSENT_VERSION, choice, chosenAt, expiresAt: sixMonthsFrom(chosenAt) });
  const href = `https://gostoa.dev/r/${slug}/?ref=private-value#private-fragment`;

  for (const saved of [null, receipt('refused'), 'accepted', receipt('accepted').replace(`"version":${CONSENT_VERSION}`, '"version":1')]) {
    const b = runBuiltScript(html, { saved, href });
    assert.deepEqual(b.replaced, [TARGET], String(saved));
    assert.equal(b.nodes.length, 0, String(saved));
    assert.equal(b.window.dataLayer, undefined, String(saved));
    assert.equal(b.timers.length, 0, String(saved));
  }

  const preview = runBuiltScript(html, { saved: receipt('accepted'), href: `http://localhost:4321/r/${slug}/` });
  assert.deepEqual(preview.replaced, [TARGET]);
  assert.equal(preview.nodes.length, 0);

  const b = runBuiltScript(html, { saved: receipt('accepted'), href, referrer: 'https://www.reddit.com/r/example/comments/private-thread/' });
  assert.deepEqual(b.replaced, [], 'waits for Google');
  assert.equal(b.nodes.length, 1);
  assert.equal(b.nodes[0].src, `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`);
  assert.equal(b.timers.length, 1);
  assert.ok(b.timers[0].delay > 0 && b.timers[0].delay <= 800);
  assert.ok(!b.commands().some(c => c[0] === 'event'), 'no event before the library loads');

  b.nodes[0].onload();
  const commands = b.commands();
  assert.ok(!JSON.stringify(commands).includes('private-'));
  const config = commands.find(c => c[0] === 'config')[2];
  assert.equal(config.send_page_view, false);
  assert.equal(config.allow_google_signals, false);
  assert.equal(config.allow_ad_personalization_signals, false);
  const events = commands.filter(c => c[0] === 'event');
  assert.equal(events.length, 1);
  assert.equal(events[0][1], 'page_view');
  assert.equal(events[0][2].page_location, `https://gostoa.dev/r/${slug}`);
  assert.equal(events[0][2].page_referrer, 'https://www.reddit.com/');
  assert.deepEqual(b.replaced, []);
  events[0][2].event_callback();
  assert.deepEqual(b.replaced, [TARGET]);

  const slow = runBuiltScript(html, { saved: receipt('accepted'), href });
  slow.timers[0].callback();
  assert.deepEqual(slow.replaced, [TARGET]);
  slow.nodes[0].onload();
  assert.ok(!slow.commands().some(c => c[0] === 'event'));
});

test('short links are absent from every sitemap', async () => {
  const sitemaps = (await readdir('dist')).filter(name => /^sitemap.*\.xml$/.test(name));
  assert.ok(sitemaps.includes('sitemap-0.xml') && sitemaps.includes('sitemap-index.xml'));
  for (const name of sitemaps) {
    const xml = await readFile(join('dist', name), 'utf8');
    assert.ok(!xml.includes('/r/'), name);
  }
  const pages = await readFile(join('dist', 'sitemap-0.xml'), 'utf8');
  assert.ok(pages.includes('<loc>https://gostoa.dev/</loc>'));
  assert.ok(pages.includes('<loc>https://gostoa.dev/privacy/</loc>'));
});
