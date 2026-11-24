import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import * as redirectLib from '../lib/short-links-redirect.js';
import redirectHandler from '../api/r/[slug].js';
import statsHandler from '../api/r-stats.js';
import * as consentModule from '../src/scripts/analytics-consent.js';
import {
  SHORT_LINK_CHANNELS,
  SHORT_LINK_SLUGS,
  SHORT_LINK_TARGET,
  shortLinkPath,
} from '../src/data/short-links.js';

const {
  compareTokensConstantTime,
  extractBearerToken,
  handleShortLinkRedirect,
  handleShortLinkStats,
  incrementShortLinkClick,
  isKnownShortLinkSlug,
  normalizeSlug,
  noStoreHeaders,
  parseDaysParam,
  parseHashCounts,
  recentUtcDays,
  redirectHeaders,
  redisCredentials,
  utcDay,
} = redirectLib;

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

const UPSTASH_ENV = {
  UPSTASH_REDIS_REST_URL: 'https://upstash.example.test',
  UPSTASH_REDIS_REST_TOKEN: 'test-upstash-token-fixture',
};

const KV_ENV = {
  KV_REST_API_URL: 'https://kv.example.test',
  KV_REST_API_TOKEN: 'test-kv-token-fixture',
};

const STATS_TOKEN = 'test-stats-bearer-fixture';
const FIXED_NOW = new Date('2026-11-24T15:30:45.123Z');

function createMockRes() {
  const headers = new Map();
  let ended = false;
  let body = '';
  return {
    statusCode: 200,
    setHeader(name, value) {
      headers.set(name.toLowerCase(), value);
    },
    getHeader(name) {
      return headers.get(name.toLowerCase());
    },
    hasHeader(name) {
      return headers.has(name.toLowerCase());
    },
    end(chunk) {
      ended = true;
      if (chunk !== undefined) body += String(chunk);
    },
    get ended() {
      return ended;
    },
    get body() {
      return body;
    },
    json() {
      return JSON.parse(body);
    },
  };
}

function assertNoStoreAndRobots(res, label = '') {
  assert.equal(res.getHeader('cache-control'), 'no-store', `${label}: Cache-Control`);
  assert.equal(res.getHeader('vercel-cdn-cache-control'), 'no-store', `${label}: Vercel-CDN-Cache-Control`);
  assert.equal(res.getHeader('cdn-cache-control'), 'no-store', `${label}: CDN-Cache-Control`);
  assert.equal(res.getHeader('x-robots-tag'), 'noindex, nofollow', `${label}: X-Robots-Tag`);
}

function createRecordingFetch(responder = () => ({ ok: true, status: 200, json: async () => [{ result: 1 }, { result: 1 }] })) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return responder(url, init, calls.length);
  };
  return { fetchImpl, calls };
}

test('data module defines exactly the 24 channel slugs and fixed GitHub target', () => {
  assert.deepEqual(SHORT_LINK_SLUGS, EXPECTED_SLUGS);
  assert.equal(SHORT_LINK_SLUGS.length, 24);
  assert.equal(new Set(SHORT_LINK_SLUGS).size, 24);
  for (const slug of SHORT_LINK_SLUGS) {
    assert.match(slug, /^[a-z0-9-]+$/);
    assert.equal(isKnownShortLinkSlug(slug), true);
  }
  assert.equal(SHORT_LINK_TARGET, TARGET);
  assert.equal(shortLinkPath('x-post'), '/r/x-post');

  const generated = Object.entries(SHORT_LINK_CHANNELS)
    .flatMap(([channel, types]) => types.map(type => `${channel}-${type}`));
  assert.deepEqual(SHORT_LINK_SLUGS, generated);
});

test('module layout keeps helpers out of api/ and exposes only named exports from lib', async () => {
  assert.equal('default' in redirectLib, false, 'helper module must not default-export an HTTP handler');
  assert.equal(typeof redirectHandler, 'function');
  assert.equal(typeof statsHandler, 'function');

  const apiFiles = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else apiFiles.push(full);
    }
  }
  await walk('api');
  assert.deepEqual(apiFiles.sort(), [join('api', 'r-stats.js'), join('api', 'r', '[slug].js')]);

  for (const removed of ['configureGoogle', 'googleTag', 'isProductionHost', 'pageContext', 'queueConsentDefaults']) {
    assert.equal(removed in consentModule, false, `${removed} should no longer be exported`);
  }
});

test('GET of every known slug returns 302 with required headers and increments via Upstash pipeline', async () => {
  for (const slug of EXPECTED_SLUGS) {
    const { fetchImpl, calls } = createRecordingFetch();
    const req = {
      method: 'GET',
      url: `/r/${slug}?utm_source=test&next=https://evil.example#private-fragment`,
      query: { slug },
      headers: {},
    };
    const res = createMockRes();

    await handleShortLinkRedirect(req, res, {
      env: UPSTASH_ENV,
      fetchImpl,
      now: FIXED_NOW,
    });

    assert.equal(res.statusCode, 302, slug);
    assert.equal(res.ended, true, slug);
    assert.equal(res.body, '', `${slug}: 302 must not send a body`);
    assertNoStoreAndRobots(res, slug);
    assert.equal(res.getHeader('location'), TARGET, `${slug}: fixed target only, no query or fragment`);
    assert.equal(res.getHeader('referrer-policy'), 'origin', slug);

    assert.equal(calls.length, 1, slug);
    assert.equal(calls[0].url, 'https://upstash.example.test/pipeline', slug);
    assert.equal(calls[0].init.method, 'POST', slug);
    assert.deepEqual(calls[0].init.headers, {
      Authorization: 'Bearer test-upstash-token-fixture',
      'Content-Type': 'application/json',
    }, slug);
    assert.deepEqual(JSON.parse(calls[0].init.body), [
      ['HINCRBY', 'r:clicks:2026-11-24', slug, 1],
      ['HINCRBY', 'r:clicks:total', slug, 1],
    ], slug);
    assert.ok(calls[0].init.signal instanceof AbortSignal, slug);
  }
});

test('UTC day key uses injected clock rather than local timezone or wall clock', async () => {
  assert.equal(utcDay(new Date('2025-01-01T00:15:00.000Z')), '2025-01-01');
  assert.equal(utcDay(Date.UTC(2025, 11, 31, 23, 59, 59)), '2025-12-31');

  const { fetchImpl, calls } = createRecordingFetch();
  const res = createMockRes();
  await handleShortLinkRedirect(
    { method: 'GET', query: { slug: 'hn-post' }, headers: {} },
    res,
    { env: UPSTASH_ENV, fetchImpl, now: Date.UTC(2024, 1, 29, 23, 30, 0) },
  );

  assert.equal(res.statusCode, 302);
  assert.deepEqual(JSON.parse(calls[0].init.body), [
    ['HINCRBY', 'r:clicks:2024-02-29', 'hn-post', 1],
    ['HINCRBY', 'r:clicks:total', 'hn-post', 1],
  ]);
});

test('HEAD returns 302 with redirect headers and never increments', async () => {
  const { fetchImpl, calls } = createRecordingFetch();
  const req = {
    method: 'HEAD',
    url: '/r/x-post?foo=bar#frag',
    query: { slug: 'x-post' },
    headers: {},
  };
  const res = createMockRes();

  await handleShortLinkRedirect(req, res, {
    env: UPSTASH_ENV,
    fetchImpl,
    now: FIXED_NOW,
  });

  assert.equal(res.statusCode, 302);
  assert.equal(res.ended, true);
  assert.equal(res.body, '');
  assertNoStoreAndRobots(res, 'HEAD');
  assert.equal(res.getHeader('location'), TARGET);
  assert.equal(res.getHeader('referrer-policy'), 'origin');
  assert.equal(calls.length, 0);
});

test('non-GET/HEAD methods return 405 with Allow header, no Location, and no increment', async () => {
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
    const { fetchImpl, calls } = createRecordingFetch();
    const res = createMockRes();
    await handleShortLinkRedirect(
      { method, query: { slug: 'x-post' }, headers: {} },
      res,
      { env: UPSTASH_ENV, fetchImpl, now: FIXED_NOW },
    );

    assert.equal(res.statusCode, 405, method);
    assert.equal(res.ended, true, method);
    assertNoStoreAndRobots(res, method);
    assert.equal(res.getHeader('allow'), 'GET, HEAD', method);
    assert.equal(res.hasHeader('location'), false, method);
    assert.equal(calls.length, 0, method);
  }
});

test('normalizeSlug handles trailing slash, array shapes, and rejects invalid slugs', async () => {
  assert.equal(normalizeSlug('x-post'), 'x-post');
  assert.equal(normalizeSlug('x-post/'), 'x-post');
  assert.equal(normalizeSlug(['x-post']), 'x-post');
  assert.equal(normalizeSlug(['ignored-query-value', 'x-post']), 'x-post');
  assert.equal(normalizeSlug(['ignored-query-value', 'x-post/']), 'x-post');

  const invalidSlugs = [
    undefined,
    null,
    '',
    '/',
    '//',
    'unknown-slug',
    'reddit-bio',
    'X-POST',
    ' x-post ',
    'x-post//',
    'x-post/extra',
    'extra/x-post',
    '/x-post',
    'x-post?foo=1',
    'x-post#frag',
    '__proto__',
    'constructor',
    123,
    {},
    [],
    [null],
    [123],
    ['x-post', ''],
    ['x-post', 'unknown'],
    ['x-post', 'x-bio/extra'],
    ['x-post', 42],
  ];

  for (const raw of invalidSlugs) {
    assert.equal(normalizeSlug(raw), null, `expected null for ${JSON.stringify(raw)}`);

    const { fetchImpl, calls } = createRecordingFetch();
    const res = createMockRes();
    await handleShortLinkRedirect(
      { method: 'GET', query: { slug: raw }, headers: {} },
      res,
      { env: UPSTASH_ENV, fetchImpl, now: FIXED_NOW },
    );

    assert.equal(res.statusCode, 404, `expected 404 for ${JSON.stringify(raw)}`);
    assertNoStoreAndRobots(res, JSON.stringify(raw));
    assert.equal(res.hasHeader('location'), false, `no Location for ${JSON.stringify(raw)}`);
    assert.equal(calls.length, 0, `no increment for ${JSON.stringify(raw)}`);
  }

  // Single trailing slash redirects cleanly and records the normalized slug without slash.
  const { fetchImpl, calls } = createRecordingFetch();
  const res = createMockRes();
  await handleShortLinkRedirect(
    { method: 'GET', query: { slug: 'github-bio/' }, headers: {} },
    res,
    { env: UPSTASH_ENV, fetchImpl, now: FIXED_NOW },
  );
  assert.equal(res.statusCode, 302);
  assert.equal(res.getHeader('location'), TARGET);
  assert.deepEqual(JSON.parse(calls[0].init.body), [
    ['HINCRBY', 'r:clicks:2026-11-24', 'github-bio', 1],
    ['HINCRBY', 'r:clicks:total', 'github-bio', 1],
  ]);
});

test('redirect fails open when env is missing/partial, Redis errors, fetch throws, or request times out', async () => {
  const cases = [
    {
      name: 'missing env',
      env: {},
      fetchImpl: async () => { throw new Error('should not be called'); },
    },
    {
      name: 'only UPSTASH_REDIS_REST_URL set',
      env: { UPSTASH_REDIS_REST_URL: 'https://upstash.example.test' },
      fetchImpl: async () => { throw new Error('should not be called'); },
    },
    {
      name: 'only UPSTASH_REDIS_REST_TOKEN set',
      env: { UPSTASH_REDIS_REST_TOKEN: 'test-token-fixture' },
      fetchImpl: async () => { throw new Error('should not be called'); },
    },
    {
      name: 'only KV_REST_API_URL set',
      env: { KV_REST_API_URL: 'https://kv.example.test' },
      fetchImpl: async () => { throw new Error('should not be called'); },
    },
    {
      name: 'Redis HTTP 500',
      env: UPSTASH_ENV,
      fetchImpl: async () => ({ ok: false, status: 500, json: async () => ({ error: 'boom' }) }),
    },
    {
      name: 'Redis malformed JSON',
      env: UPSTASH_ENV,
      fetchImpl: async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError('invalid json'); } }),
    },
    {
      name: 'fetch rejects with network error',
      env: UPSTASH_ENV,
      fetchImpl: async () => { throw new TypeError('network unreachable'); },
    },
    {
      name: 'fetch aborts on short timeout',
      env: UPSTASH_ENV,
      timeoutMs: 15,
      fetchImpl: (_url, init) => new Promise((_resolve, reject) => {
        if (init.signal.aborted) return reject(init.signal.reason);
        const pendingSocket = setTimeout(
          () => reject(new Error('expected AbortSignal.timeout to abort the request')),
          5000,
        );
        init.signal.addEventListener('abort', () => {
          clearTimeout(pendingSocket);
          reject(init.signal.reason);
        }, { once: true });
      }),
    },
    {
      name: 'custom pre-aborted AbortSignal',
      env: UPSTASH_ENV,
      signal: AbortSignal.abort(new Error('cancelled')),
      fetchImpl: (_url, init) => Promise.reject(init.signal.reason),
    },
  ];

  for (const testCase of cases) {
    const res = createMockRes();
    await handleShortLinkRedirect(
      { method: 'GET', query: { slug: 'devto-post' }, headers: {} },
      res,
      {
        env: testCase.env,
        fetchImpl: testCase.fetchImpl,
        now: FIXED_NOW,
        timeoutMs: testCase.timeoutMs,
        signal: testCase.signal,
      },
    );
    assert.equal(res.statusCode, 302, testCase.name);
    assertNoStoreAndRobots(res, testCase.name);
    assert.equal(res.getHeader('location'), TARGET, testCase.name);
    assert.equal(res.getHeader('referrer-policy'), 'origin', testCase.name);
  }
});

test('redisCredentials supports Upstash and KV env pairs, ignores partial pairs, and prefers Upstash', () => {
  assert.equal(redisCredentials({}), null);
  assert.equal(redisCredentials({ UPSTASH_REDIS_REST_URL: 'https://upstash.example.test', UPSTASH_REDIS_REST_TOKEN: '   ' }), null);
  assert.equal(redisCredentials({ KV_REST_API_URL: '  ', KV_REST_API_TOKEN: 'test-kv-token' }), null);

  // Upstash pair wins when both pairs are present.
  assert.deepEqual(
    redisCredentials({
      UPSTASH_REDIS_REST_URL: ' https://upstash.example.test/ ',
      UPSTASH_REDIS_REST_TOKEN: ' test-upstash-token ',
      ...KV_ENV,
    }),
    { url: 'https://upstash.example.test', token: 'test-upstash-token' },
  );

  // KV pair is used when Upstash vars are absent.
  assert.deepEqual(
    redisCredentials(KV_ENV),
    { url: 'https://kv.example.test', token: 'test-kv-token-fixture' },
  );

  // KV pair is used when Upstash is only half-configured.
  assert.deepEqual(
    redisCredentials({
      UPSTASH_REDIS_REST_URL: 'https://upstash.example.test',
      ...KV_ENV,
    }),
    { url: 'https://kv.example.test', token: 'test-kv-token-fixture' },
  );
});

test('Redis request headers and body never include IP, User-Agent, Cookie, or Referer from incoming req', async () => {
  const { fetchImpl, calls } = createRecordingFetch();
  const req = {
    method: 'GET',
    url: '/r/linkedin-bio?email=visitor-marker&token=query-marker#hash-marker',
    query: { slug: 'linkedin-bio' },
    headers: {
      'x-forwarded-for': 'forwarded-addr-marker',
      'x-real-ip': 'real-addr-marker',
      'user-agent': 'ua-browser-marker/1.0',
      cookie: 'session=cookie-marker; _ga=ga-marker',
      referer: 'https://social.example.test/thread/referer-marker',
      'x-custom-visitor': 'visitor-header-marker',
    },
  };
  const res = createMockRes();

  await handleShortLinkRedirect(req, res, {
    env: KV_ENV,
    fetchImpl,
    now: FIXED_NOW,
  });

  assert.equal(res.statusCode, 302);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://kv.example.test/pipeline');
  assert.deepEqual(Object.keys(calls[0].init.headers).sort(), ['Authorization', 'Content-Type']);
  const serialized = JSON.stringify({ headers: calls[0].init.headers, body: calls[0].init.body });
  for (const forbidden of [
    'forwarded-addr-marker',
    'real-addr-marker',
    'ua-browser-marker',
    'cookie-marker',
    'ga-marker',
    'referer-marker',
    'visitor-header-marker',
    'visitor-marker',
    'query-marker',
    'hash-marker',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
});

test('token comparison uses SHA-256 + timingSafeEqual and handles different lengths safely', () => {
  assert.equal(compareTokensConstantTime(STATS_TOKEN, STATS_TOKEN), true);
  assert.equal(compareTokensConstantTime('short', 'much-longer-token-value'), false);
  assert.equal(compareTokensConstantTime('much-longer-token-value', 'short'), false);
  assert.equal(compareTokensConstantTime('test-stats-bearer-fixturX', STATS_TOKEN), false);
  assert.equal(compareTokensConstantTime('', STATS_TOKEN), false);
  assert.equal(compareTokensConstantTime(STATS_TOKEN, ''), false);
  assert.equal(compareTokensConstantTime(null, STATS_TOKEN), false);
  assert.equal(compareTokensConstantTime('café-token', 'café-token'), true);
  assert.equal(compareTokensConstantTime('café-token', 'cafe-token'), false);

  assert.equal(extractBearerToken(`Bearer ${STATS_TOKEN}`), STATS_TOKEN);
  assert.equal(extractBearerToken(`bearer ${STATS_TOKEN}`), STATS_TOKEN);
  assert.equal(extractBearerToken('Basic dXNlcjpwYXNz'), null);
  assert.equal(extractBearerToken('Bearer '), null);
  assert.equal(extractBearerToken('Bearer a b'), null);
  assert.equal(extractBearerToken(undefined), null);
});

test('GET /api/r-stats enforces method, bearer auth, days validation, and store configuration', async () => {
  // 405 for non-GET methods
  for (const method of ['POST', 'PUT', 'DELETE', 'PATCH', 'HEAD']) {
    const res = createMockRes();
    await handleShortLinkStats(
      { method, headers: { authorization: `Bearer ${STATS_TOKEN}` } },
      res,
      { env: { ...UPSTASH_ENV, SHORT_LINK_STATS_TOKEN: STATS_TOKEN } },
    );
    assert.equal(res.statusCode, 405, method);
    assertNoStoreAndRobots(res, method);
    assert.equal(res.getHeader('allow'), 'GET', method);
    assert.equal(res.getHeader('content-type'), 'application/json; charset=utf-8', method);
    if (method === 'HEAD') {
      assert.equal(res.body, '');
    } else {
      assert.ok(res.json().error);
    }
  }

  // 503 when SHORT_LINK_STATS_TOKEN is missing or blank
  for (const tokenEnv of [{}, { SHORT_LINK_STATS_TOKEN: '' }, { SHORT_LINK_STATS_TOKEN: '   ' }]) {
    const res = createMockRes();
    await handleShortLinkStats(
      { method: 'GET', headers: { authorization: `Bearer ${STATS_TOKEN}` } },
      res,
      { env: { ...UPSTASH_ENV, ...tokenEnv } },
    );
    assert.equal(res.statusCode, 503);
    assertNoStoreAndRobots(res, 'disabled');
    assert.equal(res.getHeader('content-type'), 'application/json; charset=utf-8');
    assert.deepEqual(res.json(), { error: 'stats endpoint disabled' });
  }

  // 401 when Authorization is missing, non-Bearer, wrong, or different length
  for (const headers of [
    {},
    { authorization: '' },
    { authorization: 'Basic abc' },
    { authorization: 'Bearer wrong' },
    { authorization: 'Bearer x' },
    { authorization: `Bearer ${STATS_TOKEN}-extra-length` },
  ]) {
    const { fetchImpl, calls } = createRecordingFetch();
    const res = createMockRes();
    await handleShortLinkStats(
      { method: 'GET', headers },
      res,
      { env: { ...UPSTASH_ENV, SHORT_LINK_STATS_TOKEN: STATS_TOKEN }, fetchImpl },
    );
    assert.equal(res.statusCode, 401, JSON.stringify(headers));
    assertNoStoreAndRobots(res, 'unauthorized');
    assert.equal(res.getHeader('www-authenticate'), 'Bearer');
    assert.equal(res.getHeader('content-type'), 'application/json; charset=utf-8');
    assert.equal(calls.length, 0);
  }

  // 400 for invalid ?days before talking to Redis
  const badDays = ['0', '-1', '+5', '366', '30.5', '30.0', ' 30', '30 ', '30abc', '1e2', '', ['7'], ['7', '14']];
  for (const days of badDays) {
    assert.equal(parseDaysParam(days), null, `parseDaysParam(${JSON.stringify(days)})`);
    const { fetchImpl, calls } = createRecordingFetch();
    const res = createMockRes();
    await handleShortLinkStats(
      { method: 'GET', query: { days }, headers: { authorization: `Bearer ${STATS_TOKEN}` } },
      res,
      { env: { SHORT_LINK_STATS_TOKEN: STATS_TOKEN }, fetchImpl },
    );
    assert.equal(res.statusCode, 400, `days=${JSON.stringify(days)}`);
    assertNoStoreAndRobots(res, `days=${JSON.stringify(days)}`);
    assert.equal(res.getHeader('content-type'), 'application/json; charset=utf-8');
    assert.equal(calls.length, 0);
  }

  // 503 when Redis credentials are absent but bearer token is valid
  {
    const res = createMockRes();
    await handleShortLinkStats(
      { method: 'GET', query: { days: '7' }, headers: { authorization: `Bearer ${STATS_TOKEN}` } },
      res,
      { env: { SHORT_LINK_STATS_TOKEN: STATS_TOKEN } },
    );
    assert.equal(res.statusCode, 503);
    assertNoStoreAndRobots(res, 'no store');
    assert.equal(res.getHeader('content-type'), 'application/json; charset=utf-8');
    assert.deepEqual(res.json(), { error: 'counter store not configured' });
  }
});

test('GET /api/r-stats parses array and object HGETALL payloads, filters unknown slugs, and fails closed on Redis errors', async () => {
  const { fetchImpl, calls } = createRecordingFetch(() => ({
    ok: true,
    status: 200,
    json: async () => [
      // Totals as flat array with unknown slug and invalid values mixed in
      { result: ['x-post', '42', 'unknown-slug', '99', 'hn-bio', '3', 'devto-post', '-4', 'linkedin-post', 'NaN', 'github-bio', ''] },
      // 2026-11-24 as object payload
      { result: { 'x-post': '10', 'unknown-slug': '5', 'hn-bio': 2, 'devto-bio': 'abc', 'reddit-post': -1 } },
      // 2026-11-23 empty hash
      { result: [] },
      // 2026-11-22 null result (key does not exist)
      { result: null },
    ],
  }));

  const res = createMockRes();
  await handleShortLinkStats(
    { method: 'GET', query: { days: '3' }, headers: { Authorization: `Bearer ${STATS_TOKEN}` } },
    res,
    {
      env: { ...UPSTASH_ENV, SHORT_LINK_STATS_TOKEN: STATS_TOKEN },
      fetchImpl,
      now: FIXED_NOW,
    },
  );

  assert.equal(res.statusCode, 200);
  assertNoStoreAndRobots(res, 'stats 200');
  assert.equal(res.getHeader('content-type'), 'application/json; charset=utf-8');

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://upstash.example.test/pipeline');
  const sentCommands = JSON.parse(calls[0].init.body);
  assert.deepEqual(sentCommands, [
    ['HGETALL', 'r:clicks:total'],
    ['HGETALL', 'r:clicks:2026-11-24'],
    ['HGETALL', 'r:clicks:2026-11-23'],
    ['HGETALL', 'r:clicks:2026-11-22'],
  ]);
  assert.equal(JSON.stringify(sentCommands).includes('KEYS'), false);

  const body = res.json();
  assert.deepEqual(body, {
    generatedAt: '2026-11-24T15:30:45.123Z',
    timezone: 'UTC',
    daysRequested: 3,
    totals: { 'x-post': 42, 'hn-bio': 3 },
    days: {
      '2026-11-24': { 'x-post': 10, 'hn-bio': 2 },
      '2026-11-23': {},
      '2026-11-22': {},
    },
  });
  assert.deepEqual(Object.keys(body.days), ['2026-11-24', '2026-11-23', '2026-11-22']);

  // Default days=30 when omitted
  const defaultRes = createMockRes();
  const defaultFetch = createRecordingFetch(() => ({
    ok: true,
    status: 200,
    json: async () => Array.from({ length: 31 }, () => ({ result: [] })),
  }));
  await handleShortLinkStats(
    { method: 'GET', headers: { authorization: `Bearer ${STATS_TOKEN}` } },
    defaultRes,
    {
      env: { ...UPSTASH_ENV, SHORT_LINK_STATS_TOKEN: STATS_TOKEN },
      fetchImpl: defaultFetch.fetchImpl,
      now: FIXED_NOW,
    },
  );
  assert.equal(defaultRes.statusCode, 200);
  const defaultBody = defaultRes.json();
  assert.equal(defaultBody.daysRequested, 30);
  assert.equal(Object.keys(defaultBody.days).length, 30);
  assert.deepEqual(Object.keys(defaultBody.days), recentUtcDays(30, FIXED_NOW));

  // Fail closed on Redis read failure (500, network throw, pipeline command error)
  for (const failingFetch of [
    async () => ({ ok: false, status: 500, json: async () => ({}) }),
    async () => { throw new Error('connection reset'); },
    async () => ({ ok: true, status: 200, json: async () => [{ error: 'ERR failed' }, { result: [] }] }),
  ]) {
    const errRes = createMockRes();
    await handleShortLinkStats(
      { method: 'GET', query: { days: '1' }, headers: { authorization: `Bearer ${STATS_TOKEN}` } },
      errRes,
      {
        env: { ...UPSTASH_ENV, SHORT_LINK_STATS_TOKEN: STATS_TOKEN },
        fetchImpl: failingFetch,
        now: FIXED_NOW,
      },
    );
    assert.equal(errRes.statusCode, 503);
    assertNoStoreAndRobots(errRes, 'redis fail-closed');
    assert.equal(errRes.getHeader('content-type'), 'application/json; charset=utf-8');
  }
});

test('parseHashCounts and header helpers return expected shapes', () => {
  assert.deepEqual(parseHashCounts(['x-post', '0', 'hn-post', '7', 'bad', '1']), { 'x-post': 0, 'hn-post': 7 });
  assert.deepEqual(parseHashCounts({ 'x-post': 4, 'reddit-mcp-post': '9', nope: 3 }), { 'x-post': 4, 'reddit-mcp-post': 9 });
  assert.deepEqual(parseHashCounts(null), {});
  assert.deepEqual(noStoreHeaders(), {
    'Cache-Control': 'no-store',
    'Vercel-CDN-Cache-Control': 'no-store',
    'CDN-Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow',
  });
  assert.deepEqual(redirectHeaders(), {
    'Cache-Control': 'no-store',
    'Vercel-CDN-Cache-Control': 'no-store',
    'CDN-Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow',
    Location: TARGET,
    'Referrer-Policy': 'origin',
  });
});

test('default-exported Vercel handlers work with process.env and globalThis.fetch', async () => {
  const originalFetch = globalThis.fetch;
  const savedEnv = {
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    SHORT_LINK_STATS_TOKEN: process.env.SHORT_LINK_STATS_TOKEN,
  };

  try {
    process.env.UPSTASH_REDIS_REST_URL = UPSTASH_ENV.UPSTASH_REDIS_REST_URL;
    process.env.UPSTASH_REDIS_REST_TOKEN = UPSTASH_ENV.UPSTASH_REDIS_REST_TOKEN;
    process.env.SHORT_LINK_STATS_TOKEN = STATS_TOKEN;

    const { fetchImpl, calls } = createRecordingFetch((_url, init) => {
      const cmds = JSON.parse(init.body);
      if (cmds[0][0] === 'HINCRBY') {
        return { ok: true, status: 200, json: async () => [{ result: 1 }, { result: 1 }] };
      }
      return { ok: true, status: 200, json: async () => cmds.map(() => ({ result: ['x-post', '5'] })) };
    });
    globalThis.fetch = fetchImpl;

    const redirectRes = createMockRes();
    await redirectHandler({ method: 'GET', query: { slug: 'x-post' }, headers: {} }, redirectRes);
    assert.equal(redirectRes.statusCode, 302);
    assert.equal(redirectRes.getHeader('location'), TARGET);
    assertNoStoreAndRobots(redirectRes, 'default redirect handler');

    const statsRes = createMockRes();
    await statsHandler(
      { method: 'GET', url: '/api/r-stats?days=1', headers: { authorization: `Bearer ${STATS_TOKEN}` } },
      statsRes,
    );
    assert.equal(statsRes.statusCode, 200);
    assertNoStoreAndRobots(statsRes, 'default stats handler');
    assert.equal(statsRes.json().totals['x-post'], 5);
    assert.equal(calls.length, 2);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(savedEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('incrementShortLinkClick ignores unknown slugs without calling fetch', async () => {
  const { fetchImpl, calls } = createRecordingFetch();
  const ok = await incrementShortLinkClick({ slug: 'not-a-valid-slug', env: UPSTASH_ENV, fetchImpl, now: FIXED_NOW });
  assert.equal(ok, false);
  assert.equal(calls.length, 0);
});

test('vercel.json configures /r/ rewrites and places dedicated no-store headers after /(.*)', async () => {
  const config = JSON.parse(await readFile('vercel.json', 'utf8'));
  assert.equal(config.framework, 'astro');
  assert.equal(config.outputDirectory, 'dist');
  assert.equal('redirects' in config, false, 'no static redirects bypassing the function');

  assert.deepEqual(config.rewrites, [
    { source: '/r/:slug', destination: '/api/r/:slug' },
    { source: '/r/:slug/', destination: '/api/r/:slug' },
  ]);

  const globalIndex = config.headers.findIndex(rule => rule.source === '/(.*)');
  assert.ok(globalIndex >= 0, 'global /(.*) header rule must exist');

  const requiredRedirectSources = ['/r/:slug', '/r/:slug/', '/api/r/:slug'];
  for (const source of [...requiredRedirectSources, '/api/r-stats']) {
    const index = config.headers.findIndex(rule => rule.source === source);
    assert.ok(index > globalIndex, `${source} must appear after /(.*)`);
    const map = Object.fromEntries(config.headers[index].headers.map(h => [h.key, h.value]));
    assert.equal(map['Cache-Control'], 'no-store', `${source}: Cache-Control`);
    assert.equal(map['Vercel-CDN-Cache-Control'], 'no-store', `${source}: Vercel-CDN-Cache-Control`);
    assert.equal(map['CDN-Cache-Control'], 'no-store', `${source}: CDN-Cache-Control`);
    assert.equal(map['X-Robots-Tag'], 'noindex, nofollow', `${source}: X-Robots-Tag`);
    if (requiredRedirectSources.includes(source)) {
      assert.equal(map['Referrer-Policy'], 'origin', `${source}: Referrer-Policy`);
    }
  }
});
