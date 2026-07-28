/**
 * ProjectAura Service Worker
 * Handles:
 *   - Web Push notifications (background + foreground)
 *   - Offline cache (static assets + API fallback)
 *   - PWA install support
 */

const CACHE_NAME = 'projectaura-v1';
const OFFLINE_URLS = ['/', '/index.html'];

// ── Install: cache critical shell ─────────────────────────────────────────────
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ────────────────────────────────────────────────
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first, fallback to cache ───────────────────────────────────
self.addEventListener('fetch', (e) => {
  // Only handle GET requests to same origin
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('/api/')) return; // never cache API calls

  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('/')))
  );
});

// ── Push: receive and display notification ────────────────────────────────────
self.addEventListener('push', (e) => {
  let data = { title: 'ProjectAura', body: 'You have a new notification', url: '/notifications' };
  try { data = { ...data, ...e.data.json() }; } catch { /* use defaults */ }

  // Severity-based icon/badge
  const isCritical = data.title?.includes('CRITICAL') || data.title?.includes('CRISIS') || data.title?.includes('🚨');
  const icon = '/favicon.svg';
  const badge = '/favicon.svg';

  const options = {
    body: data.body,
    icon,
    badge,
    tag: data.tag || 'projectaura-notif',
    renotify: true,
    requireInteraction: isCritical,   // critical alerts persist until dismissed
    vibrate: isCritical ? [300, 100, 300, 100, 300] : [200, 100, 200],
    data: { url: data.url || '/notifications' },
    actions: [
      { action: 'open',    title: 'View',    icon: '/favicon.svg' },
      { action: 'dismiss', title: 'Dismiss'                        },
    ],
  };

  e.waitUntil(self.registration.showNotification(data.title, options));
});

// ── Notification click: open app at the right URL ────────────────────────────
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  if (e.action === 'dismiss') return;

  const url = e.notification.data?.url || '/notifications';

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Focus existing tab if open
      const existing = windowClients.find(c => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        return existing.navigate(url);
      }
      // Open new tab
      return clients.openWindow(url);
    })
  );
});

// ── Push subscription change ──────────────────────────────────────────────────
self.addEventListener('pushsubscriptionchange', (e) => {
  e.waitUntil(
    self.registration.pushManager.subscribe({ userVisibleOnly: true })
      .then(sub => {
        // Re-register with backend
        return fetch('/api/notifications/push-subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: sub.endpoint,
            p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')))),
            auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth')))),
          }),
        });
      })
  );
});
