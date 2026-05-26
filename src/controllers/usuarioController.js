import * as usuarioRepo from '../repositories/usuarioRepo.js';
import * as logRepo from '../repositories/logAdminRepo.js';
import { HttpError } from '../middlewares/errorHandler.js';

const ID_DEMO_PROTEGIDO = 1; // el usuario demo no se puede bloquear ni eliminar

// GET /api/usuarios — lista todos los usuarios (solo admin)
export async function listar(req, res, next) {
  try {
    const usuarios = await usuarioRepo.listAll();
    res.json(usuarios);
  } catch (e) { next(e); }
}

// PATCH /api/usuarios/:id/bloquear — alterna el estado activo (solo admin)
export async function bloquear(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (id === req.user.id_usuario) throw new HttpError(400, 'No puedes bloquearte a ti mismo');
    if (id === ID_DEMO_PROTEGIDO) throw new HttpError(400, 'El usuario demo no puede ser bloqueado');

    const objetivo = await usuarioRepo.findByIdAdmin(id);
    if (!objetivo) throw new HttpError(404, 'Usuario no encontrado');

    const nuevoEstado = !objetivo.activo;
    const usuario = await usuarioRepo.setActivo(id, nuevoEstado);

    await logRepo.registrar(
      req.user.id_usuario, id,
      nuevoEstado ? 'DESBLOQUEAR' : 'BLOQUEAR',
      objetivo.email
    );

    res.json(usuario);
  } catch (e) { next(e); }
}

// DELETE /api/usuarios/:id — elimina físicamente un usuario (solo admin)
export async function eliminar(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (id === req.user.id_usuario) throw new HttpError(400, 'No puedes eliminarte a ti mismo');
    if (id === ID_DEMO_PROTEGIDO) throw new HttpError(400, 'El usuario demo no puede ser eliminado');

    const objetivo = await usuarioRepo.findByIdAdmin(id);
    if (!objetivo) throw new HttpError(404, 'Usuario no encontrado');

    // Registramos la auditoría ANTES de eliminar (para conservar el dato)
    await logRepo.registrar(req.user.id_usuario, null, 'ELIMINAR', objetivo.email);

    const ok = await usuarioRepo.removeUsuario(id);
    if (!ok) throw new HttpError(404, 'Usuario no encontrado');

    res.json({ ok: true });
  } catch (e) { next(e); }
}

// GET /api/usuarios/auditoria — historial de acciones administrativas (solo admin)
export async function auditoria(req, res, next) {
  try {
    const logs = await logRepo.listar();
    res.json(logs);
  } catch (e) { next(e); }
}
