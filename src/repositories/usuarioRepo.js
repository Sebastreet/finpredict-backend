import { query } from '../db/pool.js';

export async function findByEmail(email) {
  const r = await query(
    'SELECT id_usuario, id_rol, nombre, email, contrasena_hash, activo, fecha_registro FROM usuario WHERE email = $1',
    [email]
  );
  return r.rows[0] || null;
}

export async function findById(id) {
  const r = await query(
    'SELECT id_usuario, id_rol, nombre, email, activo, fecha_registro FROM usuario WHERE id_usuario = $1',
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
    `SELECT u.id_usuario, u.id_rol, r.nombre AS rol_nombre, u.nombre, u.email,
            u.activo, u.fecha_registro
       FROM usuario u JOIN rol r ON r.id_rol = u.id_rol
      ORDER BY u.id_usuario`
  );
  return r.rows;
}

// ===== Funciones para gestión administrativa =====

// Cambia el estado activo/bloqueado de un usuario
export async function setActivo(id_usuario, activo) {
  const r = await query(
    `UPDATE usuario SET activo = $1 WHERE id_usuario = $2
     RETURNING id_usuario, nombre, email, activo`,
    [activo, id_usuario]
  );
  return r.rows[0] || null;
}

// Elimina un usuario de forma física (requiere FKs en CASCADE)
export async function removeUsuario(id_usuario) {
  const r = await query(
    `DELETE FROM usuario WHERE id_usuario = $1 RETURNING id_usuario`,
    [id_usuario]
  );
  return r.rowCount > 0;
}

// Busca un usuario por id incluyendo su estado (para validaciones admin)
export async function findByIdAdmin(id_usuario) {
  const r = await query(
    `SELECT id_usuario, nombre, email, id_rol, activo FROM usuario WHERE id_usuario = $1`,
    [id_usuario]
  );
  return r.rows[0] || null;
}
