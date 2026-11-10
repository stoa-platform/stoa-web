import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { join } from 'node:path';

async function htmlFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(path));
    else if (entry.name.endsWith('.html')) files.push(path);
  }
  return files;
}

test('every generated page has one consent control, both choices and the withdrawal control', async () => {
  const pages = await htmlFiles('dist');
  assert.equal(pages.length, 11);
  for (const path of pages) {
    const html = await readFile(path, 'utf8');
    assert.equal((html.match(/data-analytics-consent-root/g) || []).length, 1, path);
    for (const marker of ['data-consent-accept', 'data-consent-refuse', 'data-consent-revoke', 'data-consent-settings']) {
      assert.ok(html.includes(marker), `${path}: ${marker}`);
    }
    assert.ok(!/<script[^>]*\bsrc=["'][^"']*googletagmanager/i.test(html), `${path}: eager Google tag`);
    assert.ok(!/<script[^>]*\bsrc=["'][^"']*clarity\.ms/i.test(html), `${path}: eager Clarity tag`);
    for (const match of html.matchAll(/<(?:script|link)\b[^>]+(?:src|href)=["']([^"']+)["']/g)) {
      const resource = new URL(match[1], 'https://gostoa.dev');
      assert.ok(!['va.vercel-scripts.com'].includes(resource.hostname)
        && !resource.pathname.startsWith('/_vercel/insights'), `${path}: Vercel analytics remains`);
    }
    const french = /<html\s+lang="fr"/.test(html);
    assert.ok(html.includes(french ? 'Refuser' : 'Refuse'), path);
    assert.ok(html.includes(french ? 'Accepter' : 'Accept'), path);
    for (const match of html.matchAll(/<(?:script|link)[^>]+(?:src|href)="(\/_astro\/[^"?#]+)"/g)) {
      await access(join('dist', match[1]));
    }
  }
});

test('all generated forms and third-party feedback frames are masked for Clarity', async () => {
  for (const path of await htmlFiles('dist')) {
    const html = await readFile(path, 'utf8');
    for (const tag of html.match(/<(?:form|iframe)\b[^>]*>/g) || []) {
      assert.match(tag, /data-clarity-mask="true"/, `${path}: unmasked form/frame`);
    }
  }
});

test('neither layout imports or renders Vercel Analytics', async () => {
  for (const path of ['src/layouts/Layout.astro', 'src/layouts/ProductLayout.astro']) {
    const source = await readFile(path, 'utf8');
    assert.ok(!source.includes('@vercel/analytics'), path);
    assert.ok(!/<Analytics\s*\/>/.test(source), path);
  }
});

test('the generated robots allows the assets while retaining the API restriction', async () => {
  const robots = await readFile('dist/robots.txt', 'utf8');
  assert.ok(!/^Disallow:\s*\/_astro\//m.test(robots));
  assert.match(robots, /^Disallow:\s*\/api\//m);
  assert.match(robots, /^Sitemap:\s*https:\/\/gostoa\.dev\/sitemap-index\.xml/m);
});
