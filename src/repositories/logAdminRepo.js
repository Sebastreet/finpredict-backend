import { query } from '../db/pool.js';

// Registra una acción administrativa en la tabla de auditoría
export async function registrar(id_admin, id_usuario_afectado, accion, detalle) {
  const r = await query(
    `INSERT INTO log_admin (id_admin, id_usuario_afectado, accion, detalle)
     VALUES ($1, $2, $3, $4)
     RETURNING id_log, accion, detalle, fecha`,
    [id_admin, id_usuario_afectado, accion, detalle]
  );
  return r.rows[0];
}

// Lista el historial de acciones administrativas con nombres legibles
export async function listar() {
  const r = await query(
    `SELECT l.id_log, l.accion, l.detalle, l.fecha,
            a.nombre AS admin_nombre,
            COALESCE(v.nombre, '(eliminado)') AS afectado_nombre
       FROM log_admin l
       JOIN usuario a ON a.id_usuario = l.id_admin
       LEFT JOIN usuario v ON v.id_usuario = l.id_usuario_afectado
      ORDER BY l.fecha DESC
      LIMIT 100`
  );
  return r.rows;
}
