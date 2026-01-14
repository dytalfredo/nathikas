import type { Handler } from '@netlify/functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log("✅ [DeleteUsersWorker] Firebase Admin inicializado.");
        } catch (e) {
            console.error("❌ [DeleteUsersWorker] Error inicializando Firebase Admin:", e);
        }
    } else {
        console.warn("⚠️ [DeleteUsersWorker] FIREBASE_SERVICE_ACCOUNT no configurado.");
    }
}

export const handler: Handler = async (event) => {
    console.log('--- Función de Eliminación Masiva de Usuarios Iniciada ---');

    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    if (!admin.apps.length) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Configuración de servidor incompleta (Falta Service Account)' })
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
        const listUsersResult = await admin.auth().listUsers(1000);
        const usersToDelete = listUsersResult.users
            .filter(user => user.uid !== exceptUid)
            .map(user => user.uid);

        if (usersToDelete.length > 0) {
            const deleteAuthResult = await admin.auth().deleteUsers(usersToDelete);
            console.log(`✅ [DeleteUsersWorker] Eliminados ${deleteAuthResult.successCount} usuarios de Auth.`);
            if (deleteAuthResult.failureCount > 0) {
                console.warn(`⚠️ [DeleteUsersWorker] Fallo al eliminar ${deleteAuthResult.failureCount} usuarios de Auth.`);
                deleteAuthResult.errors.forEach(err => console.error(err.error));
            }
        } else {
            console.log("ℹ️ [DeleteUsersWorker] No hay otros usuarios para eliminar en Auth.");
        }

        // 2. DELETE FROM FIRESTORE (users collection)
        const usersSnapshot = await admin.firestore().collection('users').get();
        const batch = admin.firestore().batch();
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
