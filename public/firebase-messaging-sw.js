importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// These will be replaced during build or the user will need to fill them
// But for now, we can use a generic setup or ask the user to fill it.
// Actually, FCM SW needs the config to initialize.
// We'll use a template that the user can fill or we can try to inject via build.
// Since it's in public/, it's static.

firebase.initializeApp({
    apiKey: "AIzaSyAJz9axWUn-cX0vId83i6AWynS8iGNDZxo",
    authDomain: "nathikas.firebaseapp.com",
    projectId: "nathikas",
    storageBucket: "nathikas.firebasestorage.app",
    messagingSenderId: "36230074340",
    appId: "1:36230074340:web:36db352b269f481aebc1f1"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/images/logo.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
