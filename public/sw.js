/* Skandha Cars service worker.
 * - Never caches /admin, /api, auth or non-GET requests (so nothing private survives logout).
 * - Public pages: network-first, falling back to the last saved copy (the UI labels offline state as potentially stale).
 * - Static assets and images: stale-while-revalidate. */
const VERSION = "v1";
const PAGES = `sc-pages-${VERSION}`;
const ASSETS = `sc-assets-${VERSION}`;
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(PAGES).then((c) => c.add(OFFLINE_URL)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => ![PAGES, ASSETS].includes(k)).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

const isPrivate = (url) => url.pathname.startsWith("/admin") || url.pathname.startsWith("/api") || url.pathname.startsWith("/auth");

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (req.mode === "navigate") {
    if (url.origin !== self.location.origin || isPrivate(url)) return;
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok && !res.headers.get("cache-control")?.includes("no-store")) {
            const copy = res.clone();
            caches.open(PAGES).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(async () => (await caches.match(req)) || (await caches.match(OFFLINE_URL))),
    );
    return;
  }

  const cacheable =
    (url.origin === self.location.origin && (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/"))) ||
    url.hostname === "res.cloudinary.com" ||
    url.pathname.startsWith("/_next/image");
  if (!cacheable || isPrivate(url)) return;

  event.respondWith(
    caches.open(ASSETS).then(async (cache) => {
      const hit = await cache.match(req);
      const net = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    }),
  );
});
