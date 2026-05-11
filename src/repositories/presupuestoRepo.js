import { query } from '../db/pool.js';

export async function listByUsuario(id_usuario) {
  const r = await query(
    `SELECT p.*, cat.nombre AS categoria_nombre, cat.color AS categoria_color
     FROM presupuesto p
     JOIN categoria cat ON cat.id_categoria = p.id_categoria
     WHERE p.id_usuario = $1 ORDER BY p.id_presupuesto`,
    [id_usuario]
  );
  return r.rows;
}

export async function findById(id_presupuesto, id_usuario) {
  const r = await query(
    'SELECT * FROM presupuesto WHERE id_presupuesto = $1 AND id_usuario = $2',
    [id_presupuesto, id_usuario]
  );
  return r.rows[0] || null;
}

export async function create({ id_usuario, id_categoria, monto_max, periodo, vigente_desde }) {
  const r = await query(
    `INSERT INTO presupuesto (id_usuario, id_categoria, monto_max, periodo, vigente_desde)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [id_usuario, id_categoria, monto_max, periodo, vigente_desde]
  );
  return r.rows[0];
}

export async function update(id_presupuesto, id_usuario, { monto_max, periodo, vigente_desde }) {
  const r = await query(
    `UPDATE presupuesto
     SET monto_max = COALESCE($1, monto_max),
         periodo = COALESCE($2, periodo),
         vigente_desde = COALESCE($3, vigente_desde)
     WHERE id_presupuesto = $4 AND id_usuario = $5 RETURNING *`,
    [monto_max, periodo, vigente_desde, id_presupuesto, id_usuario]
  );
  return r.rows[0] || null;
}

export async function remove(id_presupuesto, id_usuario) {
  const r = await query(
    'DELETE FROM presupuesto WHERE id_presupuesto = $1 AND id_usuario = $2 RETURNING id_presupuesto',
    [id_presupuesto, id_usuario]
  );
  return r.rowCount > 0;
}
