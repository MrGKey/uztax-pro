const CACHE = "uztax-v1";
const URLS = ["/", "/index.html"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(URLS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((k) => Promise.all(k.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.url.includes("/api/")) return;
  e.respondWith(
    caches.open(CACHE).then((c) =>
      c.match(e.request).then((r) => r || fetch(e.request).then((res) => {
        if (res.ok && e.request.method === "GET") c.put(e.request, res.clone());
        return res;
      }))
    )
  );
});
