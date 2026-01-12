import { getToken } from "firebase/messaging";
import { messaging, db } from "./firebase";
import { doc, setDoc, arrayUnion } from "firebase/firestore";

const VAPID_KEY = import.meta.env.PUBLIC_FIREBASE_VAPID_KEY;

export const requestNotificationPermission = async (userId: string) => {
    if (!messaging) return;

    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('Permiso de notificación concedido.');

            // Register service worker explicitly for more control
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
                scope: '/'
            });

            const token = await getToken(messaging, {
                vapidKey: VAPID_KEY,
                serviceWorkerRegistration: registration
            });

            if (token) {
                console.log('Token FCM obtenido:', token);
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
        console.log('Token guardado en el perfil del usuario.');
    } catch (error) {
        console.error('Error al guardar el token en Firestore:', error);
    }
};
