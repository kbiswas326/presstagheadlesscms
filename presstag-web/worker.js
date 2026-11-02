import openNext from "./.open-next/worker.js";

const FRESH = 300;     // seconds served as-is (5 min)
const STALE = 86400;   // seconds a stale copy may be served while refreshing

const SKIP = /^\/(api|admin|preview|_next\/data)(\/|$)/;

// Headers copied onto the stored page so cached responses match live ones
const KEEP = [
  "link",
  "x-frame-options",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
  "cross-origin-opener-policy",
  "content-language",
];

// Query parameters that never change the page, so they are ignored in the cache key
const TRACKING = /^(utm_|fbclid$|gclid$|msclkid$|yclid$|twclid$|igshid$|mc_|_ga|ref$|ref_src$)/i;

function cacheKeyFor(url) {
  const u = new URL(url.href);
  for (const k of Array.from(u.searchParams.keys())) {
    if (TRACKING.test(k)) u.searchParams.delete(k);
  }
  u.searchParams.sort();
  u.hash = "";
  return new Request(u.toString(), { method: "GET" });
}

async function fetchAndStore(request, env, ctx, cache, key) {
  const res = await openNext.fetch(request, env, ctx);
  if (res.status !== 200 || res.headers.has("set-cookie")) return res;

  const body = await res.arrayBuffer();

  const storedHeaders = new Headers({
    "content-type": res.headers.get("content-type") || "text/html; charset=utf-8",
    "cache-control": `public, s-maxage=${FRESH + STALE}`,
    "x-edge-cached-at": String(Date.now()),
  });
  for (const name of KEEP) {
    const v = res.headers.get(name);
    if (v) storedHeaders.set(name, v);
  }

  let err = "";
  try {
    await cache.put(key, new Response(body, { status: 200, headers: storedHeaders }));
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
    const key = cacheKeyFor(url);

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