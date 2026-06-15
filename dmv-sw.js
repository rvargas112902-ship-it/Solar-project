/* Service worker for the Florida DMV Practice Test PWA.
   Caches the app shell so it installs and runs offline like a native app. */
const CACHE = "fl-dmv-test-v1";
const ASSETS = [
  "./florida-dmv-practice-test.html",
  "./dmv-manifest.webmanifest",
  "./dmv-icon-192.png",
  "./dmv-icon-512.png",
  "./dmv-icon-180.png",
  "./dmv-icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match("./florida-dmv-practice-test.html"));
    })
  );
});
