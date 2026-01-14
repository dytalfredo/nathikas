import type { Handler } from '@netlify/functions';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Initialize Firebase Admin if not already initialized
try {
    if (!getApps().length) {
        let serviceAccount;
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            try {
                serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            } catch (e) {
                console.error("❌ Error parsing FIREBASE_SERVICE_ACCOUNT env var");
            }
        }

        // Fallback to local file if env var failed or missing
        if (!serviceAccount) {
            try {
                const localPath = resolve('./service-account.json');
                if (existsSync(localPath)) {
                    serviceAccount = JSON.parse(readFileSync(localPath, 'utf-8'));
                    console.log("✅ Using local service-account.json");
                }
            } catch (e) {
                console.error("❌ Error reading local service-account.json");
            }
        }

        if (serviceAccount) {
            // Fix for newline escaping issues in private key
            if (serviceAccount.private_key) {
                serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
            }

            initializeApp({
                credential: cert(serviceAccount)
            });
            console.log("✅ [DeleteUsersWorker] Firebase Admin inicializado.");
        } else {
            console.warn("⚠️ [DeleteUsersWorker] FIREBASE_SERVICE_ACCOUNT no configurado y no se encontró service-account.json.");
        }
    }
} catch (e) {
    console.error("❌ [DeleteUsersWorker] Error inicializando Firebase Admin:", e);
}

export const handler: Handler = async (event) => {
    console.log('--- Función de Eliminación Masiva de Usuarios Iniciada ---');

    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Check initialization
    if (!getApps().length) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Configuración de servidor incompleta (Falta Service Account o Error de Init)' })
        };
    }

    try {
        const payload = JSON.parse(event.body || '{}');
        const { exceptUid } = payload;

        if (!exceptUid) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Faltan datos requeridos (exceptUid)' })
            };
        }

        console.log(`⚠️ [DeleteUsersWorker] INICIANDO PROTOCOLO DE ELIMINACIÓN MASIVA. Excluyendo: ${exceptUid}`);

        // 1. DELETE FROM AUTHENTICATION
        const auth = getAuth();
        const listUsersResult = await auth.listUsers(1000);
        const usersToDelete = listUsersResult.users
            .filter(user => user.uid !== exceptUid)
            .map(user => user.uid);

        if (usersToDelete.length > 0) {
            const deleteAuthResult = await auth.deleteUsers(usersToDelete);
            console.log(`✅ [DeleteUsersWorker] Eliminados ${deleteAuthResult.successCount} usuarios de Auth.`);
            if (deleteAuthResult.failureCount > 0) {
                console.warn(`⚠️ [DeleteUsersWorker] Fallo al eliminar ${deleteAuthResult.failureCount} usuarios de Auth.`);
                deleteAuthResult.errors.forEach(err => console.error(err.error));
            }
        } else {
            console.log("ℹ️ [DeleteUsersWorker] No hay otros usuarios para eliminar en Auth.");
        }

        // 2. DELETE FROM FIRESTORE (users collection)
        const db = getFirestore();
        const usersSnapshot = await db.collection('users').get();
        const batch = db.batch();
        let firestoreCount = 0;

        usersSnapshot.docs.forEach(doc => {
            if (doc.id !== exceptUid) {
                batch.delete(doc.ref);
                firestoreCount++;
            }
        });

        if (firestoreCount > 0) {
            await batch.commit();
            console.log(`✅ [DeleteUsersWorker] Eliminados ${firestoreCount} perfiles de Firestore.`);
        } else {
            console.log("ℹ️ [DeleteUsersWorker] No hay perfiles adicionales para eliminar en Firestore.");
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Limpieza de usuarios completada.',
                deletedAuth: usersToDelete.length,
                deletedFirestore: firestoreCount
            })
        };

    } catch (error: any) {
        console.error("❌ [DeleteUsersWorker] Error crítico:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || 'Error interno del servidor.' })
        };
    }
};
