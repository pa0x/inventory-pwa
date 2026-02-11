const CACHE_NAME = "storage-app-cache-v1";
const urlsToCache = [
    "./",
    "./list-pwa/index.html",
    "./list-pwa/app.js",
    "./list-pwa/manifest.json",
    "./list-pwa/sw.js",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];

// Install event: cache all files
self.addEventListener("install", event => {
    console.log("Service Worker installing...");
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            console.log("Caching app files");
            return cache.addAll(urlsToCache);
        })
    );
});

// Activate event: cleanup old caches
self.addEventListener("activate", event => {
    console.log("Service Worker activating...");
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        console.log("Deleting old cache:", key);
                        return caches.delete(key);
                    }
                })
            )
        )
    );
});

// Fetch event: serve cached files first
self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request)
        .then(response => {
            return response || fetch(event.request);
        })
        .catch(() => {
            // Optional: fallback if offline and not cached
            if (event.request.destination === "document") {
                return caches.match("./list-pwa/index.html");
            }
        })
    );
});


