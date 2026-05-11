import * as cuentaRepo from '../repositories/cuentaRepo.js';
import { HttpError } from '../middlewares/errorHandler.js';

export async function listar(req, res, next) {
  try {
    const cuentas = await cuentaRepo.listByUsuario(req.user.id_usuario);
    res.json(cuentas);
  } catch (e) { next(e); }
}

export async function crear(req, res, next) {
  try {
    const { alias, saldo_inicial, moneda } = req.body;
    if (!alias) throw new HttpError(400, 'El alias es obligatorio');
    if (saldo_inicial === undefined || saldo_inicial === null) {
      throw new HttpError(400, 'El saldo inicial es obligatorio');
    }
    if (parseFloat(saldo_inicial) < 0) throw new HttpError(400, 'El saldo inicial no puede ser negativo');
    const cuenta = await cuentaRepo.create({
      id_usuario: req.user.id_usuario,
      alias,
      saldo_inicial: parseFloat(saldo_inicial),
      moneda: moneda || 'CLP'
    });
    res.status(201).json(cuenta);
  } catch (e) { next(e); }
}

export async function actualizar(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const cuenta = await cuentaRepo.update(id, req.user.id_usuario, req.body);
    if (!cuenta) throw new HttpError(404, 'Cuenta no encontrada');
    res.json(cuenta);
  } catch (e) { next(e); }
}

export async function eliminar(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const ok = await cuentaRepo.remove(id, req.user.id_usuario);
    if (!ok) throw new HttpError(404, 'Cuenta no encontrada');
    res.json({ ok: true });
  } catch (e) { next(e); }
}
