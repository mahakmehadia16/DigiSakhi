const CACHE_NAME = "digisakhi-v2";
const ASSETS = [
  "/ds.html", "/login.html", "/register.html",
  "/profile.html", "/certificate.html", "/leaderboard.html",
  "/settings.html", "/digitalskills.html",
  "/shared.css", "/shared.js", "/manifest.json", "/digisakhi.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
