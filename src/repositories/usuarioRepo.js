import { query } from '../db/pool.js';

export async function findByEmail(email) {
  const r = await query(
    'SELECT id_usuario, id_rol, nombre, email, contrasena_hash, fecha_registro FROM usuario WHERE email = $1',
    [email]
  );
  return r.rows[0] || null;
}

export async function findById(id) {
  const r = await query(
    'SELECT id_usuario, id_rol, nombre, email, fecha_registro FROM usuario WHERE id_usuario = $1',
    [id]
  );
  return r.rows[0] || null;
}

export async function create({ id_rol, nombre, email, contrasena_hash }) {
  const r = await query(
    `INSERT INTO usuario (id_rol, nombre, email, contrasena_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING id_usuario, id_rol, nombre, email, fecha_registro`,
    [id_rol, nombre, email, contrasena_hash]
  );
  return r.rows[0];
}

export async function listAll() {
  const r = await query(
    `SELECT u.id_usuario, u.id_rol, r.nombre AS rol_nombre, u.nombre, u.email, u.fecha_registro
     FROM usuario u JOIN rol r ON r.id_rol = u.id_rol
     ORDER BY u.id_usuario`
  );
  return r.rows;
}
