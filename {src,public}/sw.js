// This service worker unregisters itself to prevent caching issues
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => {
  self.registration.unregister();
  caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
});
