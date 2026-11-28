import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import { join, sep } from 'node:path';

async function htmlFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(path));
    else if (entry.name.endsWith('.html')) files.push(path);
  }
  return files;
}

const normalizeWhitespace = html => html.replace(/\s+/g, ' ');

test('dist contains no /r/ directory and no built HTML under /r/', async () => {
  await assert.rejects(() => access(join('dist', 'r')), { code: 'ENOENT' });

  const builtHtml = await htmlFiles('dist');
  const shortLinkPrefix = join('dist', 'r') + sep;
  assert.deepEqual(
    builtHtml.filter(path => path.startsWith(shortLinkPrefix)),
    [],
    'no built HTML pages may exist under dist/r/',
  );
});

test('every sitemap and robots.txt omits /r/ paths', async () => {
  const sitemaps = (await readdir('dist')).filter(name => /^sitemap.*\.xml$/.test(name));
  assert.ok(sitemaps.includes('sitemap-0.xml') && sitemaps.includes('sitemap-index.xml'));
  for (const name of sitemaps) {
    const xml = await readFile(join('dist', name), 'utf8');
    assert.equal(xml.includes('/r/'), false, `${name} must not list /r/ paths`);
  }

  const pages = await readFile(join('dist', 'sitemap-0.xml'), 'utf8');
  assert.ok(pages.includes('<loc>https://gostoa.dev/</loc>'));
  assert.ok(pages.includes('<loc>https://gostoa.dev/privacy/</loc>'));

  const robots = await readFile(join('dist', 'robots.txt'), 'utf8');
  assert.equal(robots.includes('/r/'), false);
  assert.match(robots, /^Disallow:\s*\/api\//m);
});

test('/privacy and /fr/privacy document the server-side redirect counter and updated date', async () => {
  const en = normalizeWhitespace(await readFile(join('dist', 'privacy', 'index.html'), 'utf8'));
  assert.ok(en.includes('Last updated: November 24, 2026'));
  assert.ok(en.includes('Short links under /r/ perform a direct server-side redirect'));
  assert.ok(en.includes('aggregated counter by link and by UTC day'));
  assert.ok(en.includes('no cookie, no IP address, no user-agent, and no visitor identifier'));
  assert.equal(en.includes('record a page view only if you have already accepted'), false);
  assert.equal(en.includes('without showing the cookie controls'), false);
  assert.ok(en.includes('Google Analytics 4'));
  assert.ok(en.includes('Microsoft Clarity'));

  const fr = normalizeWhitespace(await readFile(join('dist', 'fr', 'privacy', 'index.html'), 'utf8'));
  assert.ok(fr.includes('Mise à jour : 24 novembre 2026'));
  assert.ok(fr.includes('Les liens courts sous /r/ effectuent une redirection directe côté serveur'));
  assert.ok(fr.includes('compteur agrégé par lien et par jour UTC'));
  assert.ok(fr.includes('sans cookie, sans adresse IP, sans user-agent et sans identifiant visiteur'));
  assert.equal(fr.includes('enregistrent une page vue uniquement si vous avez déjà accepté'), false);
  assert.equal(fr.includes('sans afficher les réglages de cookies'), false);
  assert.ok(fr.includes('Google Analytics 4'));
  assert.ok(fr.includes('Microsoft Clarity'));
});
