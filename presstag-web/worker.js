import openNext from "./.open-next/worker.js";

const FRESH = 300;     // seconds served as-is (5 min)
const STALE = 86400;   // seconds a stale copy may be served while refreshing

const SKIP = /^\/(api|admin|preview|_next\/data)(\/|$)/;

async function fetchAndStore(request, env, ctx, cache, key) {
  const res = await openNext.fetch(request, env, ctx);
  if (res.status !== 200 || res.headers.has("set-cookie")) return res;

  const body = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") || "text/html; charset=utf-8";

  let err = "";
  try {
    const stored = new Response(body, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": `public, s-maxage=${FRESH + STALE}`,
        "x-edge-cached-at": String(Date.now()),
      },
    });
    await cache.put(key, stored);
  } catch (e) {
    err = String(e && e.message ? e.message : e).slice(0, 120);
  }

  const out = new Response(body, res);
  out.headers.delete("content-length");
  out.headers.set("Cache-Control", "public, max-age=60");
  out.headers.set("x-edge-cache", "MISS");
  if (err) out.headers.set("x-edge-cache-err", err);
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
          fetchAndStore(new Request(request), env, ctx, cache, key).catch(() => {})
        );
      } else {
        out.headers.set("x-edge-cache", "HIT");
      }
      return out;
    }

    return fetchAndStore(request, env, ctx, cache, key);
  },
};