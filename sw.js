const CACHE = "tally-site-v1";
const ONLINE_ASSETS = [
  "/tally/online/",
  "/tally/online/index.html",
  "/tally/online/index.css",
  "/tally/online/renderer.js",
  "/tally/online/pwa-api.js",
  "/tally/online/mathjs/math.js",
  "/tally/online/units.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ONLINE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request)),
  );
});
