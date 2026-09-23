// Speichert die App-Dateien beim ersten Laden zwischen, damit sie danach
// auch komplett offline (ohne Internet, ohne dass GitHub erreichbar sein
// muss) startet. Strategie "stale-while-revalidate": zeigt sofort die
// zwischengespeicherte Version (schnell, funktioniert offline), lädt im
// Hintergrund aber die aktuelle Version nach, falls Internet da ist - damit
// künftige Updates trotzdem ankommen, sobald wieder online geöffnet wird.
const CACHE_NAME = "geldverrechnung-cache-v1";
const URLS_TO_CACHE = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkFetch = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);
      return cachedResponse || networkFetch;
    })
  );
});
