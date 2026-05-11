import * as transaccionService from '../services/transaccionService.js';

export async function listar(req, res, next) {
  try {
    const filtros = {
      id_cuenta: req.query.id_cuenta ? parseInt(req.query.id_cuenta) : undefined,
      id_categoria: req.query.id_categoria ? parseInt(req.query.id_categoria) : undefined,
      tipo: req.query.tipo,
      desde: req.query.desde,
      hasta: req.query.hasta,
      limit: req.query.limit
    };
    const result = await transaccionService.listar(req.user.id_usuario, filtros);
    res.json(result);
  } catch (e) { next(e); }
}

export async function crear(req, res, next) {
  try {
    const t = await transaccionService.crear(req.user.id_usuario, req.body);
    res.status(201).json(t);
  } catch (e) { next(e); }
}

export async function actualizar(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const t = await transaccionService.actualizar(req.user.id_usuario, id, req.body);
    res.json(t);
  } catch (e) { next(e); }
}

export async function eliminar(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const r = await transaccionService.eliminar(req.user.id_usuario, id);
    res.json(r);
  } catch (e) { next(e); }
}
