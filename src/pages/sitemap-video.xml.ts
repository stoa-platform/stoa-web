import type { APIRoute } from 'astro';
import { tutorial, videoFiles } from '../data/rest-mcp-tutorial';

const xmlEscapes: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };
const xml = (value: string) => value.replace(/[&<>"']/g, character => xmlEscapes[character]);

export const GET: APIRoute = ({ site }) => {
  const entries = (['en', 'fr'] as const).map((lang) => {
    const { canonical, schema } = tutorial(lang, site!);
    return `  <url>
    <loc>${xml(canonical)}</loc>
    <video:video>
      <video:thumbnail_loc>${xml(schema.thumbnailUrl)}</video:thumbnail_loc>
      <video:title>${xml(schema.name)}</video:title>
      <video:description>${xml(schema.description)}</video:description>
      <video:content_loc>${xml(schema.contentUrl)}</video:content_loc>
      <video:duration>${videoFiles.duration}</video:duration>
      <video:publication_date>${schema.uploadDate}</video:publication_date>
    </video:video>
  </url>`;
  });
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n${entries.join('\n')}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
