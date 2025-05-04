// public/service-worker.js
self.addEventListener('push', event => {
  console.log('Push event received:', event);
  
  if (!event.data) {
    console.error('No push data received');
    return;
  }
  
  const data = event.data.json();
  console.log('Push notification data:', data);
  
  const title = data.title;
  const options = {
    body: data.body,
    icon: '/logo192.png',
    badge: '/badge.png',
    vibrate: [100, 50, 100],
    data: data.data, // Make sure to pass the data object
    actions: [
      {
        action: 'view',
        title: 'View Chat',
        icon: '/view-icon.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/dismiss-icon.png'
      }
    ],
    tag: `chat-${data.data.chatId}`, // Use tag to replace old notifications
    renotify: true // Re-alert the user even if the tag matches
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const data = event.notification.data;
  
  if (event.action === 'view') {
    const chatUrl = data.url;
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
        // Check if a window is already open with the target URL
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(chatUrl) && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window found, open a new one
        if (clients.openWindow) {
          return clients.openWindow(chatUrl);
        }
      })
    );
  }
});