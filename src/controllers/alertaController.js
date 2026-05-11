import * as alertaRepo from '../repositories/alertaRepo.js';
import { generarAlertasAutomaticas } from '../services/prediccionService.js';
import { HttpError } from '../middlewares/errorHandler.js';

export async function listar(req, res, next) {
  try {
    const noLeidas = req.query.no_leidas === 'true';
    // Refrescar alertas de predicción antes de devolver el listado
    await generarAlertasAutomaticas(req.user.id_usuario).catch(() => null);
    const lista = await alertaRepo.listByUsuario(req.user.id_usuario, noLeidas);
    res.json(lista);
  } catch (e) { next(e); }
}

export async function marcarLeida(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const a = await alertaRepo.marcarLeida(id, req.user.id_usuario);
    if (!a) throw new HttpError(404, 'Alerta no encontrada');
    res.json(a);
  } catch (e) { next(e); }
}
