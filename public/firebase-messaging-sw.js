importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const queryParams = new URLSearchParams(self.location.search);

const firebaseConfig = {
  apiKey: queryParams.get("apiKey"),
  authDomain: queryParams.get("authDomain"),
  projectId: queryParams.get("projectId"),
  storageBucket: queryParams.get("storageBucket"),
  messagingSenderId: queryParams.get("messagingSenderId"),
  appId: queryParams.get("appId"),
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico',
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});