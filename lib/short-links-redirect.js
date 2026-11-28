import { createHash, timingSafeEqual } from 'node:crypto';
import {
  SHORT_LINK_CHANNELS,
  SHORT_LINK_SLUGS,
  SHORT_LINK_TARGET,
  shortLinkPath,
} from '../src/data/short-links.js';

export { SHORT_LINK_CHANNELS, SHORT_LINK_SLUGS, SHORT_LINK_TARGET, shortLinkPath };

export const DEFAULT_REDIRECT_TIMEOUT_MS = 1000;
export const DEFAULT_STATS_TIMEOUT_MS = 5000;
export const DEFAULT_STATS_DAYS = 30;
export const MAX_STATS_DAYS = 365;

const DAY_MS = 86_400_000;
const KNOWN_SLUGS = new Set(SHORT_LINK_SLUGS);

function trimmedString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function toDate(value = new Date()) {
  if (value instanceof Date) return value;
  if (typeof value === 'function') return toDate(value());
  return new Date(value);
}

function getHeader(headers, name) {
  if (!headers || typeof headers !== 'object') return undefined;
  const lower = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lower) return value;
  }
  return undefined;
}

function getDaysQueryValue(req) {
  if (req?.query && typeof req.query === 'object' && Object.prototype.hasOwnProperty.call(req.query, 'days')) {
    return req.query.days;
  }
  if (typeof req?.url === 'string' && req.url.includes('?')) {
    try {
      const values = new URL(req.url, 'http://localhost').searchParams.getAll('days');
      if (values.length === 0) return undefined;
      return values.length === 1 ? values[0] : values;
    } catch {
      return '';
    }
  }
  return undefined;
}

function applyHeaders(res, headers) {
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }
}

function sendJson(res, statusCode, body, extraHeaders = {}) {
  applyHeaders(res, {
    ...noStoreHeaders(),
    'Content-Type': 'application/json; charset=utf-8',
    ...extraHeaders,
  });
  res.statusCode = statusCode;
  res.end(JSON.stringify(body));
}

export function isKnownShortLinkSlug(value) {
  return typeof value === 'string' && KNOWN_SLUGS.has(value);
}

export function normalizeSlug(value) {
  let candidate = value;
  if (Array.isArray(candidate)) {
    if (candidate.length === 0) return null;
    candidate = candidate[candidate.length - 1];
  }
  if (typeof candidate !== 'string') return null;
  const stripped = candidate.endsWith('/') ? candidate.slice(0, -1) : candidate;
  if (!stripped || stripped.includes('/')) return null;
  return KNOWN_SLUGS.has(stripped) ? stripped : null;
}

export function utcDay(date = new Date()) {
  const d = toDate(date);
  if (Number.isNaN(d.getTime())) {
    throw new RangeError('Invalid date');
  }
  const year = String(d.getUTCFullYear()).padStart(4, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function recentUtcDays(count, now = new Date()) {
  const base = toDate(now);
  if (Number.isNaN(base.getTime())) {
    throw new RangeError('Invalid date');
  }
  const startOfTodayUtc = Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate());
  const days = [];
  for (let offset = 0; offset < count; offset++) {
    days.push(utcDay(startOfTodayUtc - offset * DAY_MS));
  }
  return days;
}

export function redisCredentials(env = process.env) {
  if (!env || typeof env !== 'object') return null;

  const upstashUrl = trimmedString(env.UPSTASH_REDIS_REST_URL).replace(/\/+$/, '');
  const upstashToken = trimmedString(env.UPSTASH_REDIS_REST_TOKEN);
  if (upstashUrl && upstashToken) {
    return { url: upstashUrl, token: upstashToken };
  }

  const kvUrl = trimmedString(env.KV_REST_API_URL).replace(/\/+$/, '');
  const kvToken = trimmedString(env.KV_REST_API_TOKEN);
  if (kvUrl && kvToken) {
    return { url: kvUrl, token: kvToken };
  }

  return null;
}

export function noStoreHeaders() {
  return {
    'Cache-Control': 'no-store',
    'Vercel-CDN-Cache-Control': 'no-store',
    'CDN-Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow',
  };
}

export function redirectHeaders(target = SHORT_LINK_TARGET) {
  return {
    ...noStoreHeaders(),
    Location: target,
    'Referrer-Policy': 'origin',
  };
}

export function extractBearerToken(headerValue) {
  if (typeof headerValue !== 'string') return null;
  const match = /^Bearer[ \t]+(\S+)$/i.exec(headerValue.trim());
  return match ? match[1] : null;
}

export function compareTokensConstantTime(provided, expected) {
  if (typeof provided !== 'string' || typeof expected !== 'string') return false;
  if (provided.length === 0 || expected.length === 0) return false;
  const providedDigest = createHash('sha256').update(provided, 'utf8').digest();
  const expectedDigest = createHash('sha256').update(expected, 'utf8').digest();
  return timingSafeEqual(providedDigest, expectedDigest);
}

export function parseDaysParam(value) {
  if (value === undefined) return DEFAULT_STATS_DAYS;
  if (typeof value !== 'string') return null;
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > MAX_STATS_DAYS) return null;
  return parsed;
}

export function parseHashCounts(raw) {
  const counts = {};
  if (!raw) return counts;

  const record = (key, value) => {
    if (typeof key !== 'string' || !KNOWN_SLUGS.has(key)) return;
    if (typeof value !== 'number' && typeof value !== 'string') return;
    if (typeof value === 'string' && value.trim() === '') return;
    const count = Number(value);
    if (!Number.isFinite(count) || count < 0) return;
    counts[key] = count;
  };

  if (Array.isArray(raw)) {
    for (let i = 0; i + 1 < raw.length; i += 2) {
      record(raw[i], raw[i + 1]);
    }
    return counts;
  }

  if (typeof raw === 'object') {
    for (const [key, value] of Object.entries(raw)) {
      record(key, value);
    }
    return counts;
  }

  return counts;
}

export async function incrementShortLinkClick({
  slug,
  env = process.env,
  fetchImpl = globalThis.fetch,
  now = new Date(),
  timeoutMs = DEFAULT_REDIRECT_TIMEOUT_MS,
  signal,
} = {}) {
  const validSlug = normalizeSlug(slug);
  if (!validSlug) return false;

  const creds = redisCredentials(env);
  if (!creds || typeof fetchImpl !== 'function') return false;

  try {
    const day = utcDay(now);
    const commands = [
      ['HINCRBY', `r:clicks:${day}`, validSlug, 1],
      ['HINCRBY', 'r:clicks:total', validSlug, 1],
    ];
    const requestSignal = signal ?? AbortSignal.timeout(timeoutMs);
    const response = await fetchImpl(`${creds.url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
      signal: requestSignal,
    });
    if (!response?.ok) return false;
    if (typeof response.json === 'function') {
      const payload = await response.json();
      if (Array.isArray(payload) && payload.some(item => item && typeof item === 'object' && item.error)) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

export async function fetchShortLinkStats({
  daysRequested = DEFAULT_STATS_DAYS,
  env = process.env,
  fetchImpl = globalThis.fetch,
  now = new Date(),
  timeoutMs = DEFAULT_STATS_TIMEOUT_MS,
  signal,
} = {}) {
  const creds = redisCredentials(env);
  if (!creds) {
    throw new Error('Counter store not configured');
  }
  if (typeof fetchImpl !== 'function') {
    throw new Error('Fetch implementation unavailable');
  }

  const timestamp = toDate(now);
  const dayKeys = recentUtcDays(daysRequested, timestamp);
  const commands = [
    ['HGETALL', 'r:clicks:total'],
    ...dayKeys.map(day => ['HGETALL', `r:clicks:${day}`]),
  ];
  const requestSignal = signal ?? AbortSignal.timeout(timeoutMs);

  const response = await fetchImpl(`${creds.url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${creds.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
    signal: requestSignal,
  });

  if (!response?.ok) {
    throw new Error(`Counter store returned HTTP ${response?.status ?? 'error'}`);
  }

  const results = await response.json();
  if (!Array.isArray(results) || results.length !== commands.length) {
    throw new Error('Unexpected counter store response');
  }
  for (const entry of results) {
    if (!entry || typeof entry !== 'object' || entry.error) {
      throw new Error('Counter store command error');
    }
  }

  const totals = parseHashCounts(results[0].result);
  const days = {};
  for (let i = 0; i < dayKeys.length; i++) {
    days[dayKeys[i]] = parseHashCounts(results[i + 1].result);
  }

  return {
    generatedAt: timestamp.toISOString(),
    timezone: 'UTC',
    daysRequested,
    totals,
    days,
  };
}

export async function handleShortLinkRedirect(req, res, options = {}) {
  const method = typeof req?.method === 'string' ? req.method.toUpperCase() : '';

  if (method !== 'GET' && method !== 'HEAD') {
    applyHeaders(res, {
      ...noStoreHeaders(),
      Allow: 'GET, HEAD',
    });
    res.statusCode = 405;
    res.end();
    return;
  }

  const slug = normalizeSlug(req?.query?.slug);
  if (!slug) {
    applyHeaders(res, noStoreHeaders());
    res.statusCode = 404;
    res.end();
    return;
  }

  if (method === 'GET') {
    await incrementShortLinkClick({
      slug,
      env: 'env' in options ? options.env : process.env,
      fetchImpl: 'fetchImpl' in options ? options.fetchImpl : globalThis.fetch,
      now: options.now ?? new Date(),
      timeoutMs: options.timeoutMs,
      signal: options.signal,
    });
  }

  applyHeaders(res, redirectHeaders(SHORT_LINK_TARGET));
  res.statusCode = 302;
  res.end();
}

export async function handleShortLinkStats(req, res, options = {}) {
  const method = typeof req?.method === 'string' ? req.method.toUpperCase() : '';

  if (method !== 'GET') {
    applyHeaders(res, {
      ...noStoreHeaders(),
      'Content-Type': 'application/json; charset=utf-8',
      Allow: 'GET',
    });
    res.statusCode = 405;
    res.end(method === 'HEAD' ? undefined : JSON.stringify({ error: 'method not allowed' }));
    return;
  }

  const env = 'env' in options ? options.env : process.env;
  const expectedToken = trimmedString(env?.SHORT_LINK_STATS_TOKEN);
  if (!expectedToken) {
    sendJson(res, 503, { error: 'stats endpoint disabled' });
    return;
  }

  const providedToken = extractBearerToken(getHeader(req?.headers, 'authorization'));
  if (!providedToken || !compareTokensConstantTime(providedToken, expectedToken)) {
    sendJson(res, 401, { error: 'unauthorized' }, { 'WWW-Authenticate': 'Bearer' });
    return;
  }

  const daysRequested = parseDaysParam(getDaysQueryValue(req));
  if (daysRequested === null) {
    sendJson(res, 400, { error: 'invalid days parameter' });
    return;
  }

  if (!redisCredentials(env)) {
    sendJson(res, 503, { error: 'counter store not configured' });
    return;
  }

  try {
    const payload = await fetchShortLinkStats({
      daysRequested,
      env,
      fetchImpl: 'fetchImpl' in options ? options.fetchImpl : globalThis.fetch,
      now: options.now ?? new Date(),
      timeoutMs: options.timeoutMs,
      signal: options.signal,
    });
    sendJson(res, 200, payload);
  } catch {
    sendJson(res, 503, { error: 'counter store unavailable' });
  }
}
