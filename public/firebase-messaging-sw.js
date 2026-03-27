
// Scripts for firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the
// configuration via URL search parameters when registering the SW.
const urlParams = new URLSearchParams(location.search);

firebase.initializeApp({
  apiKey: urlParams.get('apiKey') || '', 
  projectId: urlParams.get('projectId') || '',
  messagingSenderId: urlParams.get('messagingSenderId') || '305128362624',
  appId: urlParams.get('appId') || '',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // FCM automatically shows a notification if the payload contains a "notification" object.
  // We do not need to call self.registration.showNotification manually unless handling data-only payloads.
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || (event.notification.data?.FCM_MSG?.notification?.click_action) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Try to focus an existing window or open a new one
        for (var i = 0; i < windowClients.length; i++) {
          var client = windowClients[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
