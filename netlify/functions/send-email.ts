import type { Handler } from '@netlify/functions';
import { Resend } from 'resend';

export const handler: Handler = async (event) => {
    console.log('--- Email Function Started ---');

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            console.error('ERROR: RESEND_API_KEY is not defined in environment variables');
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Configuración de servidor incompleta (API KEY)' }),
            };
        }

        const resend = new Resend(apiKey);

        let body;
        try {
            body = JSON.parse(event.body || '{}');
        } catch (parseErr) {
            console.error('ERROR: Failed to parse request body:', event.body);
            return { statusCode: 400, body: 'Invalid JSON body' };
        }

        const { to, userName, orderId, status, reason } = body;
        console.log(`Processing email for ${userName} (${to}) - Status: ${status} - Order: ${orderId}`);

        if (!to || !orderId || !status) {
            console.warn('WARNING: Missing required fields');
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Faltan campos requeridos (to, orderId, status)' }),
            };
        }

        let subject = '';
        let html = '';
        const shortId = orderId.slice(0, 8);

        if (status === 'pagado') {
            subject = `¡Pago confirmado! Nathikas #${shortId}`;
            html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 4px solid #F2A900; border-radius: 20px; overflow: hidden; background-color: #FDF6E3;">
          <div style="background-color: #D91A2A; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 10px 0; font-size: 24px;">¡Pago Confirmado!</h1>
          </div>
          <div style="padding: 30px; color: #3E2723;">
            <p style="font-size: 16px;">Hola <strong>${userName}</strong>,</p>
            <p style="font-size: 16px;">Hemos verificado con éxito el pago de tu pedido <strong>#${shortId}</strong>.</p>
            <p style="font-size: 16px;">Tu orden ahora está en proceso de preparación. Te avisaremos apenas el envío esté en camino.</p>
            <div style="margin-top: 30px; border-top: 1px solid #E6D9B8; padding-top: 20px; font-size: 12px; color: #7D6B5D; text-align: center;">
              Gracias por preferir Nathikas - El sabor más picante de México.
            </div>
          </div>
        </div>
      `;
        } else if (status === 'despachado') {
            subject = `¡Tu pedido va en camino! Nathikas #${shortId}`;
            html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 4px solid #F2A900; border-radius: 20px; overflow: hidden; background-color: #FDF6E3;">
          <div style="background-color: #D91A2A; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 10px 0; font-size: 24px;">¡Envío en Camino!</h1>
          </div>
          <div style="padding: 30px; color: #3E2723;">
            <p style="font-size: 16px;">Hola <strong>${userName}</strong>,</p>
            <p style="font-size: 16px;">¡Buenas noticias! Tu pedido <strong>#${shortId}</strong> ha sido despachado y va en camino a su destino.</p>
            <p style="font-size: 16px;">Pronto recibirás tus Nathikas cargadas de sabor y picante.</p>
            <div style="margin-top: 30px; border-top: 1px solid #E6D9B8; padding-top: 20px; font-size: 12px; color: #7D6B5D; text-align: center;">
              Nathikas - Spicy Gummies & Chamoy.
            </div>
          </div>
        </div>
      `;
        } else if (status === 'cancelado') {
            subject = `Actualización de tu pedido Nathikas #${shortId}`;
            html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 4px solid #D91A2A; border-radius: 20px; overflow: hidden; background-color: #FDF6E3;">
          <div style="background-color: #3E2723; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 10px 0; font-size: 24px;">Pedido Cancelado</h1>
          </div>
          <div style="padding: 30px; color: #3E2723;">
            <p style="font-size: 16px;">Hola <strong>${userName}</strong>,</p>
            <p style="font-size: 16px;">Te informamos que tu pedido <strong>#${shortId}</strong> ha sido cancelado.</p>
            ${reason ? `<p style="background-color: #F8D7DA; padding: 10px; border-radius: 10px; color: #721C24;"><strong>Motivo:</strong> ${reason}</p>` : ''}
            <p style="font-size: 16px;">Si tienes alguna duda, puedes contactarnos directamente vía WhatsApp.</p>
            <div style="margin-top: 30px; border-top: 1px solid #E6D9B8; padding-top: 20px; font-size: 12px; color: #7D6B5D; text-align: center;">
              Atentamente, el equipo de Nathikas.
            </div>
          </div>
        </div>
      `;
        }

        if (!html) {
            console.warn(`WARNING: Invalid status received: ${status}`);
            return { statusCode: 400, body: 'Invalid status for email' };
        }

        console.log('Attempting to send email via Resend...');
        const { data, error } = await resend.emails.send({
            from: 'Nathikas <onboarding@resend.dev>',
            to: [to],
            // Note: In onboarding mode, 'to' must be your account email.
            // For now we leave it as 'to', but be aware of Resend's restriction.
            subject: subject,
            html: html,
        });

        if (error) {
            console.error('RESEND ERROR:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: error.message }),
            };
        }

        console.log('SUCCESS: Email sent successfully! Resend ID:', data?.id);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Email sent successfully', id: data?.id }),
        };
    } catch (err: any) {
        console.error('CRITICAL FUNCTION ERROR:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message }),
        };
    }
};
