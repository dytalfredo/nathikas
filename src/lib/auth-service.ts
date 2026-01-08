import { onAuthStateChanged, signInWithEmailAndPassword, signOut, signInAnonymously } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { useAuthStore, type UserRole } from "../store/authStore";

export const initAuth = () => {
    if (!auth || typeof auth.onAuthStateChanged !== 'function') {
        console.warn("Firebase Auth no está inicializado o configurado correctamente.");
        useAuthStore.getState().setUser(null);
        return;
    }

    console.log("Iniciando escucha de estado de sesión...");
    onAuthStateChanged(auth, async (user) => {
        console.log("Cambio de estado de Auth:", user ? (user.isAnonymous ? "Cliente Anónimo" : "Usuario Registrado") : "Sin sesión");
        if (user) {
            try {
                // Si es anónimo, no buscamos rol en Firestore
                if (user.isAnonymous) {
                    useAuthStore.getState().setUser({
                        uid: user.uid,
                        email: null,
                        role: 'vendedor' as UserRole // Le damos un rol base simbólico o null
                    });
                    return;
                }

                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const role = userDoc.data().role as UserRole;
                    console.log("Rol obtenido del perfil:", role);
                    useAuthStore.getState().setUser({
                        uid: user.uid,
                        email: user.email,
                        role: role
                    });
                } else {
                    console.warn("⚠️ Perfil de Firestore no encontrado para UID:", user.uid);
                    useAuthStore.getState().setUser({
                        uid: user.uid,
                        email: user.email,
                        role: null
                    });
                }
            } catch (err: any) {
                console.error("❌ Error al obtener perfil de usuario:", err.message);
                useAuthStore.getState().setUser({
                    uid: user.uid,
                    email: user.email,
                    role: null
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

export const logout = async () => {
    await signOut(auth);
};
