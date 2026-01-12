import type { Handler } from '@netlify/functions';
import { Resend } from 'resend';
import * as admin from 'firebase-admin';

// Inicializar Firebase Admin si se proporcionan credenciales
if (!admin.apps.length && process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin inicializado correctamente");
    } catch (e) {
        console.error("Error inicializando Firebase Admin:", e);
    }
} else if (!admin.apps.length) {
    console.warn("FIREBASE_SERVICE_ACCOUNT no configurado. Notificaciones Push desactivadas.");
}

export const handler: Handler = async (event) => {
    console.log('--- Función de Notificación Unificada Iniciada ---');

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Método no permitido' };
    }

    try {
        const payload = JSON.parse(event.body || '{}');
        const { to, userName, orderId, customerId, status, reason } = payload;

        if (!to || !status) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Faltan campos (to, status)' }) };
        }

        const resendKey = process.env.RESEND_API_KEY || process.env.RESEND_APY_KEY;
        const resend = new Resend(resendKey);

        // 1. Definir Contenido HTML Basado en el Estatus (Templates Consolidados)
        let htmlContent = "";
        const shortId = (orderId || '').slice(0, 8);

        if (status === 'pagado') {
            htmlContent = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 4px solid #F2A900; border-radius: 20px; overflow: hidden; background-color: #FDF6E3;">
                  <div style="background-color: #D91A2A; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 10px 0; font-size: 24px;">Nathikas</h1>
                  </div>
                  <div style="padding: 30px; color: #3E2723;">
                    <h2 style="color: #D91A2A;">¡Pago Verificado!</h2>
                    <p>Hola <strong>${userName}</strong>,</p>
                    <p>Hemos verificado tu pago para el pedido <strong>#${shortId}</strong>.</p>
                    <p>Estamos preparando tus gomitas para que salgan lo antes posible. ¡Gracias por tu compra!</p>
                    <div style="margin-top: 30px; border-top: 1px solid #E6D9B8; padding-top: 20px; font-size: 12px; color: #7D6B5D; text-align: center;">
                      Nathikas - Spicy Gummies & Chamoy.
                    </div>
                  </div>
                </div>
            `;
        } else if (status === 'despachado') {
            htmlContent = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 4px solid #F2A900; border-radius: 20px; overflow: hidden; background-color: #FDF6E3;">
                  <div style="background-color: #D91A2A; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 10px 0; font-size: 24px;">Nathikas</h1>
                  </div>
                  <div style="padding: 30px; color: #3E2723;">
                    <h2 style="color: #F2A900;">¡Tu pedido va en camino!</h2>
                    <p>Hola <strong>${userName}</strong>,</p>
                    <p>Tu pedido <strong>#${shortId}</strong> ha sido despachado hoy.</p>
                    <p>Pronto recibirás la guía de seguimiento por WhatsApp.</p>
                    <div style="margin-top: 30px; border-top: 1px solid #E6D9B8; padding-top: 20px; font-size: 12px; color: #7D6B5D; text-align: center;">
                      Nathikas - Spicy Gummies & Chamoy.
                    </div>
                  </div>
                </div>
            `;
        } else if (status === 'cancelado') {
            htmlContent = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 4px solid #F2A900; border-radius: 20px; overflow: hidden; background-color: #FDF6E3;">
                  <div style="background-color: #D91A2A; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 10px 0; font-size: 24px;">Nathikas</h1>
                  </div>
                  <div style="padding: 30px; color: #3E2723;">
                    <h2 style="color: #D91A2A;">Pedido Cancelado</h2>
                    <p>Hola <strong>${userName}</strong>,</p>
                    <p>Tu pedido <strong>#${shortId}</strong> ha sido cancelado por el siguiente motivo:</p>
                    <blockquote style="background: #FDF6E3; padding: 10px; border-left: 5px solid #D91A2A; border: 1px solid #E6D9B8;">
                        ${reason || "No especificado"}
                    </blockquote>
                    <p>Si crees que esto es un error, por favor contáctanos por WhatsApp.</p>
                    <div style="margin-top: 30px; border-top: 1px solid #E6D9B8; padding-top: 20px; font-size: 12px; color: #7D6B5D; text-align: center;">
                      Nathikas - Spicy Gummies & Chamoy.
                    </div>
                  </div>
                </div>
            `;
        } else {
            // Fallback genérico
            htmlContent = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 4px solid #F2A900; border-radius: 20px; padding: 30px; background-color: #FDF6E3;">
                    <p>Hola ${userName}, el estado de tu pedido #${shortId} ha cambiado a: <strong>${status}</strong>.</p>
                </div>
            `;
        }

        // 2. Intentar cargar plantillas personalizadas desde Firestore (Opcional)
        let pushTemplate = {
            title: `Actualización de Pedido`,
            body: `Tu pedido #${shortId} cambió a ${status}`
        };

        if (admin.apps.length) {
            try {
                const settingsDoc = await admin.firestore().doc('settings/global').get();
                if (settingsDoc.exists) {
                    const settings = settingsDoc.data();
                    const templates = settings?.notifications;
                    if (templates) {
                        const s = status as 'pagado' | 'despachado' | 'cancelado';
                        // Para el email, si hay template en Firestore, podrías usarlo, pero aquí priorizamos el diseño HTML rico
                        if (templates.push && templates.push[s]) pushTemplate = templates.push[s];
                    }
                }
            } catch (err) {
                console.error("Error cargando plantillas de Firestore:", err);
            }
        }

        const results: any = { email: null, push: null };

        // 3. Enviar Correo Electrónico
        try {
            console.log(`Enviando email a ${to}...`);
            const { data, error } = await resend.emails.send({
                from: 'Nathikas <notificaciones@nathikas.com>',
                to: [to],
                subject: `Actualización de tu pedido Nathikas #${shortId} - ${status}`,
                html: htmlContent,
            });
            results.email = { data, error };
        } catch (err: any) {
            console.error("Error con Resend:", err);
            results.email = { error: err.message };
        }

        // 4. Enviar Notificación Push
        if (admin.apps.length && customerId) {
            try {
                const userDoc = await admin.firestore().doc(`users/${customerId}`).get();
                const tokens = userDoc.data()?.fcmTokens || [];

                if (tokens.length > 0) {
                    const message = {
                        notification: {
                            title: pushTemplate.title.replace(/{{orderId}}/g, shortId),
                            body: pushTemplate.body.replace(/{{orderId}}/g, shortId).replace(/{{status}}/g, status),
                        },
                        tokens: tokens,
                    };
                    const response = await admin.messaging().sendEachForMulticast(message);
                    results.push = { successCount: response.successCount, failureCount: response.failureCount };
                }
            } catch (err: any) {
                console.error("Error enviando Push:", err);
                results.push = { error: err.message };
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Proceso de notificación completado', results })
        };

    } catch (error: any) {
        console.error('Error crítico en función:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
