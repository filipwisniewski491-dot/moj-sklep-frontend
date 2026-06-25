const SITE_URL = 'https://centrumrolnictwa.com';
const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'https://panel.centrumrolnictwa.com';
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

export const revalidate = 86400;

interface Cat { handle: string; updated_at?: string; }

export async function GET() {
  const categories: Cat[] = [];

  try {
    const headers: any = { 'Content-Type': 'application/json' };
    if (PUBLISHABLE_KEY) headers['x-publishable-api-key'] = PUBLISHABLE_KEY;

    // Medusa paginuje - pobieramy partiami po 200 aż do końca
    let offset = 0;
    const limit = 200;
    while (true) {
      const res = await fetch(
        `${MEDUSA_URL}/store/product-categories?limit=${limit}&offset=${offset}&fields=handle,updated_at`,
        { headers, next: { revalidate: 86400 } }
      );
      if (!res.ok) break;
      const json = await res.json();
      const batch = json.product_categories || [];
      for (const c of batch) {
        if (c.handle) categories.push({ handle: c.handle, updated_at: c.updated_at });
      }
      const count = json.count ?? 0;
      offset += limit;
      if (offset >= count || batch.length === 0) break;
    }
  } catch (e) {
    console.error('sitemap-categories error:', e);
  }

  const now = new Date().toISOString();
  const urls = categories.map(c => {
    const lastmod = c.updated_at ? new Date(c.updated_at).toISOString() : now;
    return `  <url>
    <loc>${SITE_URL}/kategoria/${encodeURIComponent(c.handle)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}