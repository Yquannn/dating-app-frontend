// public/service-worker.js
self.addEventListener('push', function(e) {
    console.log('Push event received:', e);
    
    let data = {};
    if (e.data) {
      data = e.data.json();
    }
    
    const title = data.title || 'New message';
    const body = data.body || 'You have a new message';
    const icon = '/logo192.png';
    const badge = '/badge.png';
    
    const options = {
      body: body,
      icon: icon,
      badge: badge,
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/chat/' + data.chatId
      },
      actions: [
        {
          action: 'view',
          title: 'View'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };
    
    e.waitUntil(
      self.registration.showNotification(title, options)
    );
  });
  
  self.addEventListener('notificationclick', function(e) {
    const clickedNotification = e.notification;
    clickedNotification.close();
    
    // Handle the notification click
    if (e.action === 'view') {
      // Open the chat URL
      const urlToOpen = e.notification.data.url;
      const promiseChain = clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      })
      .then((windowClients) => {
        let matchingClient = null;
        
        for (let i = 0; i < windowClients.length; i++) {
          const windowClient = windowClients[i];
          if (windowClient.url.includes(urlToOpen)) {
            matchingClient = windowClient;
            break;
          }
        }
        
        if (matchingClient) {
          return matchingClient.focus();
        } else {
          return clients.openWindow(urlToOpen);
        }
      });
      
      e.waitUntil(promiseChain);
    }
  });