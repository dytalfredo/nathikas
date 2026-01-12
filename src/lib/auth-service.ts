import { onAuthStateChanged, signInWithEmailAndPassword, signOut, signInAnonymously, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, initMessaging } from "./firebase";
import { useAuthStore, type UserRole } from "../store/authStore";
import { requestNotificationPermission } from "./notification-service";

export const initAuth = () => {
    if (!auth || typeof auth.onAuthStateChanged !== 'function') {
        console.warn("Firebase Auth no está inicializado o configurado correctamente.");
        useAuthStore.getState().setUser(null);
        return;
    }

    console.log("Iniciando escucha de estado de sesión...");
    initMessaging(); // Inicializar mensajería asíncronamente
    onAuthStateChanged(auth, async (user) => {
        console.log("Cambio de estado de Auth:", user ? (user.isAnonymous ? "Cliente Anónimo" : "Usuario Registrado") : "Sin sesión");
        if (user) {
            try {
                // Si es anónimo, no buscamos rol en Firestore
                if (user.isAnonymous) {
                    useAuthStore.getState().setUser({
                        uid: user.uid,
                        email: null,
                        role: 'vendedor' as UserRole,
                        isAnonymous: true
                    });
                    return;
                }

                if (!db) {
                    console.warn("Firestore 'db' no inicializado para obtener rol.");
                    useAuthStore.getState().setUser({
                        uid: user.uid,
                        email: user.email,
                        role: null
                    });
                    return;
                }

                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    const role = data.role as UserRole;
                    console.log("Rol obtenido del perfil:", role);
                    useAuthStore.getState().setUser({
                        uid: user.uid,
                        email: user.email,
                        role: role,
                        name: data.name,
                        phone: data.phone,
                        cedula: data.cedula,
                        isAnonymous: false
                    });

                    // Solicitar permisos de notificación para el Staff
                    if (['administrator', 'asistente', 'vendedor'].includes(role) && user.uid) {
                        requestNotificationPermission(user!.uid as string);
                    }
                } else {
                    console.warn("⚠️ Perfil de Firestore no encontrado para UID:", user.uid);
                    useAuthStore.getState().setUser({
                        uid: user.uid,
                        email: user.email,
                        role: null,
                        isAnonymous: false
                    });
                }
            } catch (err: any) {
                console.error("❌ Error al obtener perfil de usuario:", err.message);
                useAuthStore.getState().setUser({
                    uid: user.uid,
                    email: user.email,
                    role: null,
                    isAnonymous: false
                });
            }
        } else {
            useAuthStore.getState().setUser(null);
        }
    });
};

export const loginAnonymously = async () => {
    try {
        const result = await signInAnonymously(auth);
        return result.user;
    } catch (err) {
        console.error("Error en login anónimo:", err);
        return null;
    }
};

export const loginWithGoogle = async () => {
    if (!auth) return null;
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        return result.user;
    } catch (err) {
        console.error("Error en Google Login:", err);
        return null;
    }
};

export const syncUserProfile = async (uid: string, data: { name: string; phone: string; cedula: string; email?: string | null }) => {
    if (!db) return;
    try {
        const userRef = doc(db, "users", uid);
        const userDoc = await getDoc(userRef);

        const profileData = {
            ...data,
            role: userDoc.exists() ? (userDoc.data().role || 'customer') : 'customer',
            updatedAt: serverTimestamp()
        };

        if (!userDoc.exists()) {
            // @ts-ignore
            profileData.createdAt = serverTimestamp();
        }

        await setDoc(userRef, profileData, { merge: true });
        console.log("Perfil de usuario sincronizado correctamente.");
    } catch (err) {
        console.error("Error al sincronizar perfil:", err);
    }
};

export const logout = async () => {
    await signOut(auth);
};
