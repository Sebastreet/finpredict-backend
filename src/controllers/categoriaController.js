import * as categoriaRepo from '../repositories/categoriaRepo.js';
import { HttpError } from '../middlewares/errorHandler.js';

export async function listar(req, res, next) {
  try {
    const tipo = req.query.tipo || null;
    if (tipo && !['I', 'G'].includes(tipo)) {
      throw new HttpError(400, "El parámetro tipo debe ser 'I' o 'G'");
    }
    const categorias = await categoriaRepo.listByUsuario(req.user.id_usuario, tipo);
    res.json(categorias);
  } catch (e) { next(e); }
}

export async function crear(req, res, next) {
  try {
    const { nombre, tipo, color } = req.body;
    if (!nombre || !tipo) throw new HttpError(400, 'Faltan campos: nombre, tipo');
    if (!['I', 'G'].includes(tipo)) throw new HttpError(400, "tipo debe ser 'I' o 'G'");
    const categoria = await categoriaRepo.create({
      id_usuario: req.user.id_usuario, nombre, tipo, color
    });
    res.status(201).json(categoria);
  } catch (e) { next(e); }
}

export async function actualizar(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const categoria = await categoriaRepo.update(id, req.user.id_usuario, req.body);
    if (!categoria) throw new HttpError(404, 'Categoría no encontrada');
    res.json(categoria);
  } catch (e) { next(e); }
}

export async function eliminar(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const ok = await categoriaRepo.remove(id, req.user.id_usuario);
    if (!ok) throw new HttpError(404, 'Categoría no encontrada');
    res.json({ ok: true });
  } catch (e) { next(e); }
}
