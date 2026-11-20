///web> src/app/robots.txt/route.js//
export async function GET(request) {
  const origin = (() => {
    try {
      return new URL(request.url).origin;
    } catch {
      return 'http://localhost:3001';
    }
  })();
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /*?s=',
    'Disallow: /*&s=',
    'Disallow: /*?arena_mid',
    'Disallow: /*&arena_mid',
    'Disallow: /*?startAfter',
    'Disallow: /_live/',
    '',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
}
