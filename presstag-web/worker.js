import openNext from "./.open-next/worker.js";

const STALE = 86400; // seconds an old copy may be served while refreshing (normal pages only)

const SKIP = /^\/(api|admin|preview|_next\/data)(\/|$)/;

// Live pages are never cached. This catches them by URL even without the page marker.
const LIVE_URL = /(live-updates|liveblog|live-blog|\/live\/|scorecard|match-centre)/i;
// The page itself declares it is live with <meta name="x-live" content="1">
const LIVE_MARKER = 'name="x-live"';

const KEEP = [
  "link",
  "x-frame-options",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
  "cross-origin-opener-policy",
  "content-language",
];

const TRACKING = /^(utm_|fbclid$|gclid$|msclkid$|yclid$|twclid$|igshid$|mc_|_ga|ref$|ref_src$)/i;

// ---- Live blog updates: shared 5-second cache ----
const LIVE_ORIGIN = "https://laudable-integrity-production-2328.up.railway.app/api";
const LIVE_API = /^\/_live\/posts\/slug\/([A-Za-z0-9._%-]+)$/;
const LIVE_API_FRESH = 5;    // seconds a live API answer is shared between readers
const LIVE_API_GRACE = 60;   // if Railway fails, an answer this young may still be served

async function fetchLiveOrigin(slug) {
  return fetch(`${LIVE_ORIGIN}/posts/slug/${slug}`, {
    headers: { "x-tenant-id": "sportzpoint", accept: "application/json" },
  });
}

async function liveApi(slug, ctx) {
  try {
    const cache = caches.default;
    const key = new Request("https://sportzpoint.com/_live-cache/" + slug);

    let oldBody = null;
    let oldType = "application/json";
    const hit = await cache.match(key);
    if (hit) {
      const age = (Date.now() - Number(hit.headers.get("x-cached-at") || 0)) / 1000;
      if (age <= LIVE_API_GRACE) {
        oldBody = await hit.arrayBuffer();
        oldType = hit.headers.get("content-type") || oldType;
        if (age <= LIVE_API_FRESH) {
          return new Response(oldBody, {
            status: 200,
            headers: {
              "content-type": oldType,
              "cache-control": "public, max-age=0, must-revalidate",
              "x-live-cache": "HIT",
            },
          });
        }
      }
    }

    let res = null;
    try {
      res = await fetchLiveOrigin(slug);
    } catch {}

    if (!res || res.status !== 200) {
      if (oldBody) {
        return new Response(oldBody, {
          status: 200,
          headers: {
            "content-type": oldType,
            "cache-control": "public, max-age=0, must-revalidate",
            "x-live-cache": "STALE",
          },
        });
      }
      return new Response("Upstream error", {
        status: res ? res.status : 502,
        headers: { "cache-control": "no-store" },
      });
    }

    const body = await res.arrayBuffer();
    const type = res.headers.get("content-type") || "application/json";
    try {
      ctx.waitUntil(
        cache.put(
          key,
          new Response(body, {
            status: 200,
            headers: {
              "content-type": type,
              "cache-control": `public, s-maxage=${LIVE_API_GRACE + 30}`,
              "x-cached-at": String(Date.now()),
            },
          })
        )
      );
    } catch {}

    return new Response(body, {
      status: 200,
      headers: {
        "content-type": type,
        "cache-control": "public, max-age=0, must-revalidate",
        "x-live-cache": "MISS",
      },
    });
  } catch (e) {
    // Never crash: fall back to a plain pass-through and report why
    const msg = String(e && e.message ? e.message : e).replace(/[^\x20-\x7E]/g, "?").slice(0, 150);
    try {
      const res = await fetchLiveOrigin(slug);
      const body = await res.arrayBuffer();
      return new Response(body, {
        status: res.status,
        headers: {
          "content-type": res.headers.get("content-type") || "application/json",
          "cache-control": "no-store",
          "x-live-cache": "ERROR",
          "x-live-error": msg,
        },
      });
    } catch {
      return new Response("Bad gateway", {
        status: 502,
        headers: { "cache-control": "no-store", "x-live-error": msg },
      });
    }
  }
}

// ---- Normal pages ----
function freshFor(pathname) {
  if (
    pathname === "/" ||
    pathname.startsWith("/category/") ||
    pathname.startsWith("/tag/") ||
    pathname.startsWith("/tags/")
  ) return 60;
  return 300;
}

function cacheKeyFor(url) {
  const u = new URL(url.href);
  for (const k of Array.from(u.searchParams.keys())) {
    if (TRACKING.test(k)) u.searchParams.delete(k);
  }
  u.searchParams.sort();
  u.hash = "";
  return new Request(u.toString(), { method: "GET" });
}

async function fetchAndStore(request, env, ctx, cache, key, pathname) {
  const res = await openNext.fetch(request, env, ctx);
  if (res.status !== 200 || res.headers.has("set-cookie")) return res;

  const body = await res.arrayBuffer();
  const type = res.headers.get("content-type") || "text/html; charset=utf-8";

  // Live page: never store it, and remove any older stored copy
  if (type.includes("text/html") && new TextDecoder().decode(body).includes(LIVE_MARKER)) {
    ctx.waitUntil(cache.delete(key));
    const live = new Response(body, res);
    live.headers.delete("content-length");
    live.headers.set("x-edge-cache", "BYPASS-LIVE");
    return live;
  }

  const fresh = freshFor(pathname);
  const storedHeaders = new Headers({
    "content-type": type,
    "cache-control": `public, s-maxage=${fresh + STALE}`,
    "x-edge-cached-at": String(Date.now()),
    "x-edge-fresh": String(fresh),
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

    // Live blog updates API (checked first)
    const liveMatch = url.pathname.match(LIVE_API);
    if (liveMatch && request.method === "GET") return liveApi(liveMatch[1], ctx);

    const cacheable =
      request.method === "GET" &&
      !request.headers.get("rsc") &&
      !request.headers.get("next-router-prefetch") &&
      !SKIP.test(url.pathname) &&
      !LIVE_URL.test(url.pathname);

    if (!cacheable) return openNext.fetch(request, env, ctx);

    const cache = caches.default;
    const key = cacheKeyFor(url);

    const hit = await cache.match(key);
    if (hit) {
      const fresh = Number(hit.headers.get("x-edge-fresh")) || freshFor(url.pathname);
      const age = (Date.now() - Number(hit.headers.get("x-edge-cached-at") || 0)) / 1000;

      if (age <= fresh + STALE) {
        const out = new Response(hit.body, hit);
        out.headers.set("Cache-Control", "public, max-age=60");
        if (age > fresh) {
          out.headers.set("x-edge-cache", "STALE");
          ctx.waitUntil(
            fetchAndStore(new Request(request), env, ctx, cache, key, url.pathname).catch(() => {})
          );
        } else {
          out.headers.set("x-edge-cache", "HIT");
        }
        return out;
      }
    }

    return fetchAndStore(request, env, ctx, cache, key, url.pathname);
  },
};