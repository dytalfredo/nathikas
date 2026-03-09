import { getToken } from "firebase/messaging";
import { getMessagingInstance, db } from "./firebase";
import { doc, setDoc, arrayUnion } from "firebase/firestore";

const VAPID_KEY = import.meta.env.PUBLIC_FIREBASE_VAPID_KEY;

export const requestNotificationPermission = async (userId: string) => {


    const messaging = getMessagingInstance();
    if (!messaging) {
        console.warn("🔍 [NotifService] Messaging instance is null (getMessagingInstance returned null). Aborting.");
        return;
    }

    if (Notification.permission === 'granted') {

        // We can still try to refresh token here if needed, but for now just return or proceed
        // If we want to ensure token is fresh:
    }

    try {

        const permission = await Notification.requestPermission();


        if (permission === 'granted') {


            // Register service worker explicitly for more control
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
                scope: '/'
            });

            console.log('Service Worker registered with scope:', registration.scope);

            // Wait for the Service Worker to be fully active
            await navigator.serviceWorker.ready;

            const token = await getToken(messaging, {
                vapidKey: VAPID_KEY,
                serviceWorkerRegistration: await navigator.serviceWorker.ready
            });

            if (token) {

                await saveTokenToUser(userId, token);
            } else {
                console.warn('No se pudo obtener el token FCM.');
            }
        } else {
            console.warn('Permiso de notificación denegado.');
        }
    } catch (error) {
        console.error('Error al solicitar permiso de notificación:', error);
    }
};

const saveTokenToUser = async (userId: string, token: string) => {
    if (!db) return;
    try {
        const userRef = doc(db, "users", userId);
        await setDoc(userRef, {
            fcmTokens: arrayUnion(token)
        }, { merge: true });

    } catch (error) {
        console.error('Error al guardar el token en Firestore:', error);
    }
};
