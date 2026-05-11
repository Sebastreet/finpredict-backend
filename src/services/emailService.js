import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP no configurado: el envío de correos está desactivado');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  return transporter;
}

/**
 * Envía un correo con el reporte Excel adjunto.
 */
export async function enviarReporte({ to, nombre, excelBuffer, periodo }) {
  const t = getTransporter();
  if (!t) {
    throw new Error('Servicio de correo no disponible. Configura SMTP en variables de entorno.');
  }
  const fechaHoy = new Date().toLocaleDateString('es-CL');
  const info = await t.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: `Reporte de transacciones FinPredict — ${fechaHoy}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #1F2937;">
        <h2 style="color: #1F3864;">Hola ${nombre || ''},</h2>
        <p>Adjunto encontrarás tu reporte de transacciones generado el <b>${fechaHoy}</b>${periodo ? ` correspondiente al período <b>${periodo}</b>` : ''}.</p>
        <p>El archivo Excel incluye el detalle de movimientos, totales de ingresos y gastos, y el balance del período.</p>
        <p style="color: #6B7280; font-size: 12px; margin-top: 24px;">
          Este correo fue enviado automáticamente por FinPredict — Tu asistente de gestión financiera predictiva.
        </p>
      </div>
    `,
    attachments: [
      {
        filename: `reporte_finpredict_${fechaHoy.replace(/\//g, '-')}.xlsx`,
        content: excelBuffer
      }
    ]
  });
  return { messageId: info.messageId };
}
