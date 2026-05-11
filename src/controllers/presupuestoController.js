import * as presupuestoRepo from '../repositories/presupuestoRepo.js';
import * as categoriaRepo from '../repositories/categoriaRepo.js';
import { HttpError } from '../middlewares/errorHandler.js';

export async function listar(req, res, next) {
  try {
    const lista = await presupuestoRepo.listByUsuario(req.user.id_usuario);
    res.json(lista);
  } catch (e) { next(e); }
}

export async function crear(req, res, next) {
  try {
    const { id_categoria, monto_max, periodo, vigente_desde } = req.body;
    if (!id_categoria || !monto_max || !periodo || !vigente_desde) {
      throw new HttpError(400, 'Faltan campos: id_categoria, monto_max, periodo, vigente_desde');
    }
    if (!['SEMANAL', 'MENSUAL'].includes(periodo)) {
      throw new HttpError(400, "periodo debe ser 'SEMANAL' o 'MENSUAL'");
    }
    if (parseFloat(monto_max) <= 0) throw new HttpError(400, 'El monto máximo debe ser positivo');

    const cat = await categoriaRepo.findById(id_categoria, req.user.id_usuario);
    if (!cat) throw new HttpError(404, 'La categoría no existe o no es del usuario');

    const p = await presupuestoRepo.create({
      id_usuario: req.user.id_usuario, id_categoria, monto_max, periodo, vigente_desde
    });
    res.status(201).json(p);
  } catch (e) { next(e); }
}

export async function actualizar(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const p = await presupuestoRepo.update(id, req.user.id_usuario, req.body);
    if (!p) throw new HttpError(404, 'Presupuesto no encontrado');
    res.json(p);
  } catch (e) { next(e); }
}

export async function eliminar(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const ok = await presupuestoRepo.remove(id, req.user.id_usuario);
    if (!ok) throw new HttpError(404, 'Presupuesto no encontrado');
    res.json({ ok: true });
  } catch (e) { next(e); }
}
