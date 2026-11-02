import openNext from "./.open-next/worker.js";

const FRESH = 300;     // seconds a cached page is served as-is (5 min)
const STALE = 86400;   // seconds a stale page may still be served while refreshing

const SKIP = /^\/(api|admin|preview|_next\/data)(\/|$)/;

async function fetchAndStore(request, env, ctx, cache, key) {
  const res = await openNext.fetch(request, env, ctx);
  if (res.status !== 200 || res.headers.has("set-cookie")) return res;

  const copy = res.clone();
  const headers = new Headers(copy.headers);
  headers.delete("vary");
  headers.set("Cache-Control", `public, s-maxage=${FRESH + STALE}`);
  headers.set("x-edge-cached-at", String(Date.now()));
  ctx.waitUntil(cache.put(key, new Response(copy.body, { status: 200, headers })));

  const out = new Response(res.body, res);
  out.headers.set("Cache-Control", "public, max-age=60");
  out.headers.set("x-edge-cache", "MISS");
  return out;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cacheable =
      request.method === "GET" &&
      !request.headers.get("rsc") &&
      !request.headers.get("next-router-prefetch") &&
      !SKIP.test(url.pathname);

    if (!cacheable) return openNext.fetch(request, env, ctx);

    const cache = caches.default;
    const key = new Request(url.origin + url.pathname + url.search, { method: "GET" });

    const hit = await cache.match(key);
    if (hit) {
      const age = (Date.now() - Number(hit.headers.get("x-edge-cached-at") || 0)) / 1000;
      const out = new Response(hit.body, hit);
      out.headers.set("Cache-Control", "public, max-age=60");
      if (age > FRESH) {
        out.headers.set("x-edge-cache", "STALE");
        ctx.waitUntil(
          fetchAndStore(new Request(request), env, ctx, cache, key).then((r) => r.body && r.body.cancel())
        );
      } else {
        out.headers.set("x-edge-cache", "HIT");
      }
      return out;
    }

    return fetchAndStore(request, env, ctx, cache, key);
  },
};