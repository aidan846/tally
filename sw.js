// Retire the old root-scoped calculator worker. The real PWA worker lives at
// /tally/online/sw.js and must keep its narrower /online/ scope.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    self.registration.unregister().then(() =>
      self.clients.matchAll({ type: "window" }).then((clients) => {
        clients.forEach((client) => client.navigate(client.url));
      }),
    ),
  );
});
