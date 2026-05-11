import { query } from '../db/pool.js';

export async function listByUsuario(id_usuario, soloNoLeidas = false) {
  const params = [id_usuario];
  let sql = 'SELECT * FROM alerta WHERE id_usuario = $1';
  if (soloNoLeidas) sql += ' AND leida = FALSE';
  sql += ' ORDER BY fecha_generada DESC LIMIT 50';
  const r = await query(sql, params);
  return r.rows;
}

export async function create({ id_usuario, tipo, mensaje, severidad }) {
  const r = await query(
    `INSERT INTO alerta (id_usuario, tipo, mensaje, severidad)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [id_usuario, tipo, mensaje, severidad]
  );
  return r.rows[0];
}

export async function marcarLeida(id_alerta, id_usuario) {
  const r = await query(
    `UPDATE alerta SET leida = TRUE
     WHERE id_alerta = $1 AND id_usuario = $2 RETURNING *`,
    [id_alerta, id_usuario]
  );
  return r.rows[0] || null;
}

// Para evitar duplicar alertas activas del mismo tipo en el mismo día
export async function existeAlertaHoy(id_usuario, tipo) {
  const r = await query(
    `SELECT 1 FROM alerta
     WHERE id_usuario = $1 AND tipo = $2
       AND DATE(fecha_generada) = CURRENT_DATE
     LIMIT 1`,
    [id_usuario, tipo]
  );
  return r.rowCount > 0;
}
