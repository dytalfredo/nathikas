import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
    authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.PUBLIC_FIREBASE_APP_ID
};

// Check if we have a valid config before initializing
const isConfigValid = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== "your_api_key";

if (!isConfigValid) {
    console.warn("Configuración de Firebase incompleta o inválida. Revisa tu archivo .env");
}

const app = isConfigValid
    ? (!getApps().length ? initializeApp(firebaseConfig) : getApp())
    : null;

export const auth = app ? getAuth(app) : { onAuthStateChanged: (cb: any) => { console.warn("Auth no disponible"); } } as any;
export const db = app ? getFirestore(app) : null as any;

// Initialize messaging only in browser and if supported
let messagingInstance: any = null;

export const initMessaging = async () => {
    if (typeof window !== 'undefined' && app) {
        try {
            const { getMessaging, isSupported } = await import("firebase/messaging");
            const supported = await isSupported();
            if (supported) {
                messagingInstance = getMessaging(app);
                return messagingInstance;
            }
        } catch (e) {
            console.warn("Firebase Messaging no es compatible con este entorno:", e);
        }
    }
    return null;
};

// Export a way to get the instance
export const getMessagingInstance = () => messagingInstance;
export const messaging = messagingInstance; // Keep for compatibility if needed, but it might be null initially
