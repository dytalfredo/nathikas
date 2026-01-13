import { onAuthStateChanged, signInWithEmailAndPassword, signOut, signInAnonymously, GoogleAuthProvider, signInWithPopup, linkWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { auth, db, initMessaging } from "./firebase";
import { useAuthStore, type UserRole } from "../store/authStore";
import { requestNotificationPermission } from "./notification-service";

export const initAuth = () => {
    if (!auth || typeof auth.onAuthStateChanged !== 'function') {
        console.warn("Firebase Auth no está inicializado o configurado correctamente.");
        useAuthStore.getState().setUser(null);
        return;
    }

    let unsubscribeDoc: (() => void) | null = null;

    console.log("Iniciando escucha de estado de sesión...");
    initMessaging(); // Inicializar mensajería asíncronamente
    onAuthStateChanged(auth, async (user) => {
        console.log("🔥 [AUTH DEBUG]AuthState Changed:", user ? `UID: ${user.uid} | Anon: ${user.isAnonymous}` : "No User");
        if (user) {
            console.log("🔥 [AUTH DEBUG] User details:", {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                phoneNumber: user.phoneNumber,
                isAnonymous: user.isAnonymous
            });
        }

        // Cleanup previous doc listener
        if (unsubscribeDoc) {
            unsubscribeDoc();
            unsubscribeDoc = null;
        }

        if (user) {
            try {
                // Si es anónimo, no buscamos rol en Firestore ni escuchamos cambios
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

                // Listen to real-time changes on the user profile
                unsubscribeDoc = onSnapshot(doc(db, "users", user.uid), (userDoc) => {
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        const role = data.role as UserRole;
                        console.log("🔥 [FIRESTORE DEBUG] Perfil actualizado:", data);
                        useAuthStore.getState().setUser({
                            uid: user.uid,
                            email: user.email,
                            role: role,
                            name: data.name,
                            phone: data.phone,
                            cedula: data.cedula,
                            isAnonymous: false
                        });

                        // Solicitar permisos de notificación para el Staff (solo una vez o verificar lógica)
                        if (role && ['administrator', 'asistente', 'vendedor'].includes(role) && user && user.uid) {
                            requestNotificationPermission(user.uid as string);
                        }
                    } else {
                        // Doc doesn't exist yet (maybe just created auth but not profile)
                        console.warn("⚠️ [FIRESTORE DEBUG] Perfil NO encontrado en DB para UID:", user.uid);
                        console.log("🔥 [FALLBACK DEBUG] Usando datos del provider:", {
                            name: user.displayName,
                            phone: user.phoneNumber
                        });

                        useAuthStore.getState().setUser({
                            uid: user.uid,
                            email: user.email,
                            role: null,
                            // Fallback to auth provider data if firestore is empty
                            name: user.displayName || undefined,
                            phone: user.phoneNumber || undefined,
                            isAnonymous: false
                        });
                    }
                }, (error: any) => {
                    console.error("❌ Error escuchando perfil de usuario:", error);
                });

            } catch (err: any) {
                console.error("❌ Error al inicializar listener de usuario:", err.message);
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
    const provider = new GoogleAuthProvider();

    try {
        const currentUser = auth.currentUser;

        // If we are currently anonymous, try to link the credential first
        if (currentUser && currentUser.isAnonymous) {
            try {
                console.log("Intentando vincular cuenta Google a sesión anónima actual...");
                const result = await linkWithPopup(currentUser, provider);
                console.log("Cuenta vinculada con éxito");
                return result.user;
            } catch (linkError: any) {
                // If credential already used, we must sign in normally (switching accounts)
                if (linkError.code === 'auth/credential-already-in-use') {
                    console.log("La cuenta ya existe, cambiando de usuario...");
                    const result = await signInWithPopup(auth, provider);
                    return result.user;
                }
                throw linkError; // Throw other errors
            }
        } else {
            // Standard login
            const result = await signInWithPopup(auth, provider);
            return result.user;
        }
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
