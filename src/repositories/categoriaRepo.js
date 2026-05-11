import { query } from '../db/pool.js';

export async function listByUsuario(id_usuario, tipo = null) {
  const params = [id_usuario];
  let sql = 'SELECT * FROM categoria WHERE id_usuario = $1';
  if (tipo) {
    sql += ' AND tipo = $2';
    params.push(tipo);
  }
  sql += ' ORDER BY nombre';
  const r = await query(sql, params);
  return r.rows;
}

export async function findById(id_categoria, id_usuario) {
  const r = await query(
    'SELECT * FROM categoria WHERE id_categoria = $1 AND id_usuario = $2',
    [id_categoria, id_usuario]
  );
  return r.rows[0] || null;
}

export async function create({ id_usuario, nombre, tipo, color }) {
  const r = await query(
    `INSERT INTO categoria (id_usuario, nombre, tipo, color)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [id_usuario, nombre, tipo, color || null]
  );
  return r.rows[0];
}

export async function update(id_categoria, id_usuario, { nombre, color }) {
  const r = await query(
    `UPDATE categoria
     SET nombre = COALESCE($1, nombre), color = COALESCE($2, color)
     WHERE id_categoria = $3 AND id_usuario = $4 RETURNING *`,
    [nombre, color, id_categoria, id_usuario]
  );
  return r.rows[0] || null;
}

export async function remove(id_categoria, id_usuario) {
  const r = await query(
    'DELETE FROM categoria WHERE id_categoria = $1 AND id_usuario = $2 RETURNING id_categoria',
    [id_categoria, id_usuario]
  );
  return r.rowCount > 0;
}
