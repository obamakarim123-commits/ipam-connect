importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging.js');

const firebaseConfig = {
  apiKey: "AIzaSyBxJeDq2KGUkqHJG4WB2Epi2gOMYQY3OGE",
  authDomain: "ipam-connect-f2439.firebaseapp.com",
  projectId: "ipam-connect-f2439",
  storageBucket: "ipam-connect-f2439.appspot.com",
  messagingSenderId: "782146546382",
  appId: "1:782146546382:web:c2ce387b248e7eca673e9f"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'IPAM Connect';
  const notificationOptions = {
    body: payload.notification?.body || 'New message',
    icon: '/assets/images/images.jpg'
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
