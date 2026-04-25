// Self-unregister: remove stale service worker
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => {
  self.registration.unregister();
  self.clients.matchAll({ type: "window" }).then((clients) => {
    clients.forEach((c) => c.navigate(c.url));
  });
});
