import type { Handler } from '@netlify/functions';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin if not already initialized
try {
    if (!getApps().length) {
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            initializeApp({
                credential: cert(serviceAccount)
            });
            console.log("✅ [CreateUserWorker] Firebase Admin inicializado.");
        } else {
            console.warn("⚠️ [CreateUserWorker] FIREBASE_SERVICE_ACCOUNT no configurado.");
        }
    }
} catch (e) {
    console.error("❌ [CreateUserWorker] Error inicializando Firebase Admin:", e);
}

export const handler: Handler = async (event) => {
    console.log('--- Función de Creación de Usuario Iniciada ---');

    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Checking if Admin SDK is ready
    if (!getApps().length) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Configuración de servidor incompleta (Falta Service Account)' })
        };
    }

    try {
        const payload = JSON.parse(event.body || '{}');
        const { email, password, role, name } = payload;

        if (!email || !password || !role) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Faltan datos requeridos (email, password, role)' })
            };
        }

        console.log(`👤 [CreateUserWorker] Intentando crear usuario: ${email} con rol ${role}...`);

        // 1. Create User in Firebase Authentication
        const auth = getAuth();
        const userRecord = await auth.createUser({
            email: email,
            password: password,
            displayName: name || email.split('@')[0],
        });

        console.log(`✅ [CreateUserWorker] Usuario Auth creado. UID: ${userRecord.uid}`);

        // 2. Create User Profile in Firestore
        // This bypasses client-side security rules because we are using Admin SDK
        const db = getFirestore();
        await db.collection('users').doc(userRecord.uid).set({
            email: email,
            role: role, // 'administrator', 'asistente', 'vendedor'
            name: name || email.split('@')[0],
            createdAt: FieldValue.serverTimestamp(),
            isAnonymous: false,
            // Add any other default fields here
        });

        console.log(`✅ [CreateUserWorker] Perfil Firestore creado para ${userRecord.uid}`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Usuario creado exitosamente',
                uid: userRecord.uid,
                email: userRecord.email
            })
        };

    } catch (error: any) {
        console.error("❌ [CreateUserWorker] Error creando usuario:", error);

        // Handle specific Firebase Auth errors for better client feedback
        let errorMessage = error.message;
        if (error.code === 'auth/email-already-exists') {
            errorMessage = 'El correo electrónico ya está en uso por otro usuario.';
        } else if (error.code === 'auth/invalid-password') {
            errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
        }

        return {
            statusCode: 500,
            body: JSON.stringify({ error: errorMessage })
        };
    }
};
