import type { APIRoute } from 'astro';

// Nota: El usuario debe configurar RESEND_API_KEY en su .env
const RESEND_API_KEY = import.meta.env.RESEND_API_KEY;

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { to, subject, userName, orderId, status, reason, items, total } = body;

        if (!RESEND_API_KEY) {
            console.warn("RESEND_API_KEY no configurada. Saltando envío de correo.");
            return new Response(JSON.stringify({ success: false, message: "API Key missing" }), { status: 200 });
        }

        let htmlContent = "";

        if (status === 'pagado') {
            htmlContent = `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
                    <h2 style="color: #D91A2A;">¡Pago Verificado!</h2>
                    <p>Hola <strong>${userName}</strong>,</p>
                    <p>Hemos verificado tu pago para el pedido <strong>#${orderId.slice(0, 8)}</strong>.</p>
                    <p>Estamos preparando tus gomitas para que salgan lo antes posible. ¡Gracias por tu compra!</p>
                </div>
            `;
        } else if (status === 'despachado') {
            htmlContent = `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
                    <h2 style="color: #F2A900;">¡Tu pedido va en camino!</h2>
                    <p>Hola <strong>${userName}</strong>,</p>
                    <p>Tu pedido <strong>#${orderId.slice(0, 8)}</strong> ha sido despachado hoy.</p>
                    <p>Pronto recibirás la guía de seguimiento por WhatsApp.</p>
                </div>
            `;
        } else if (status === 'cancelado') {
            htmlContent = `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; background-color: #fff5f5;">
                    <h2 style="color: #D91A2A;">Pedido Cancelado</h2>
                    <p>Hola <strong>${userName}</strong>,</p>
                    <p>Tu pedido <strong>#${orderId.slice(0, 8)}</strong> ha sido cancelado por el siguiente motivo:</p>
                    <blockquote style="background: #eee; padding: 10px; border-left: 5px solid #D91A2A;">
                        ${reason || "No especificado"}
                    </blockquote>
                    <p>Si crees que esto es un error, por favor contáctanos por WhatsApp.</p>
                </div>
            `;
        }

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: 'Nathikas <notificaciones@nathikas.com>',
                to: [to],
                subject: subject || `Actualización de tu pedido Nathikas - ${status}`,
                html: htmlContent
            })
        });

        const data = await res.json();
        return new Response(JSON.stringify(data), { status: 200 });

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
