self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SCHEDULE_NOTIFICATIONS') {
    scheduleDaily(e.data.times);
  }
});

function scheduleDaily(times) {
  times.forEach(({ delay, msg }) => {
    setTimeout(() => {
      self.registration.showNotification('📚 영작 퀴즈 알림', {
        body: msg,
        icon: '/quiz/icon.png',
        badge: '/quiz/icon.png',
        vibrate: [200, 100, 200],
        tag: 'quiz-reminder',
        requireInteraction: false,
        data: { url: self.registration.scope }
      });
    }, delay);
  });
}

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      for (const c of list) {
        if (c.url === e.notification.data.url && 'focus' in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow(e.notification.data.url);
    })
  );
});
