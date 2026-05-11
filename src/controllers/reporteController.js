import { generarExcel } from '../services/reporteService.js';
import { enviarReporte } from '../services/emailService.js';
import * as usuarioRepo from '../repositories/usuarioRepo.js';

export async function descargarExcel(req, res, next) {
  try {
    const filtros = {
      desde: req.query.desde,
      hasta: req.query.hasta
    };
    const buffer = await generarExcel(req.user.id_usuario, filtros);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="reporte_finpredict.xlsx"`);
    res.send(Buffer.from(buffer));
  } catch (e) { next(e); }
}

export async function enviarPorCorreo(req, res, next) {
  try {
    const filtros = {
      desde: req.body.desde,
      hasta: req.body.hasta
    };
    const periodo = req.body.desde && req.body.hasta
      ? `${req.body.desde} a ${req.body.hasta}`
      : null;
    const usuario = await usuarioRepo.findById(req.user.id_usuario);
    const buffer = await generarExcel(req.user.id_usuario, filtros);
    const result = await enviarReporte({
      to: usuario.email,
      nombre: usuario.nombre,
      excelBuffer: Buffer.from(buffer),
      periodo
    });
    res.json({ ok: true, messageId: result.messageId, enviado_a: usuario.email });
  } catch (e) { next(e); }
}
