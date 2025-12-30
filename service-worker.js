/* MPGB Calendar – PWA Safe Service Worker (no stuck cache) */

const CACHE_NAME = "mpgb-calendar-v2026-final-01";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./offline.html",
  "./manifest.json",
  "./header_v2.png",
  "./icon-192.png",
  "./icon-512.png"
];

/* INSTALL */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

/* ACTIVATE: delete old caches */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : null))
      )
    )
  );
  self.clients.claim();
});

/* FETCH */
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // HTML navigation => NETWORK FIRST (so updates show immediately)
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match("./offline.html"))
    );
    return;
  }

  // Static assets => CACHE FIRST + update cache in background
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      });
    })
  );
});
