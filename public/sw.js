// Service Worker cho Bí Mật Đôi Ta (Hỗ trợ Web Push Notifications & PWA)
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Xử lý khi người dùng chạm vào thông báo trên điện thoại
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Nếu trang web đang mở, chuyển tiêu điểm tới trang
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      // Nếu chưa mở, mở trang chủ
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
