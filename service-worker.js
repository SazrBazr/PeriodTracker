self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('period-tracker-cache').then(async (cache) => {
            const urlsToCache = [
                '/',
                'index.html',
                'styles.css',
                'main.js',
                'icons/AppIcon192.png'
            ];
            for (const url of urlsToCache) {
                try {
                    await cache.add(url);
                } catch (error) {
                    console.error(`Failed to cache ${url}:`, error);
                }
            }
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
