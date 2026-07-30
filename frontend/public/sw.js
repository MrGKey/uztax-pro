const CACHE = "soliqpay-v3";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((k) => Promise.all(k.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.url.includes("/api/")) return;
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request).catch(() => caches.match("/index.html")));
    return;
  }
  e.respondWith(
    caches.open(CACHE).then((c) =>
      c.match(e.request).then((r) => r || fetch(e.request).then((res) => {
        if (res.ok && e.request.method === "GET" && !e.request.url.includes("telegram")) {
          c.put(e.request, res.clone());
        }
        return res;
      }).catch(() => new Response("", { status: 503 })))
    )
  );
});
