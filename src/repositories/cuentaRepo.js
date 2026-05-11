import { query } from '../db/pool.js';

// Lista todas las cuentas del usuario, calculando el saldo actual
// como saldo_inicial + suma de ingresos - suma de gastos.
export async function listByUsuario(id_usuario) {
  const r = await query(
    `SELECT
       c.id_cuenta, c.alias, c.saldo_inicial, c.moneda, c.fecha_creacion,
       c.saldo_inicial
         + COALESCE((SELECT SUM(monto) FROM transaccion t WHERE t.id_cuenta = c.id_cuenta AND t.tipo = 'I'), 0)
         - COALESCE((SELECT SUM(monto) FROM transaccion t WHERE t.id_cuenta = c.id_cuenta AND t.tipo = 'G'), 0)
         AS saldo_actual
     FROM cuenta c
     WHERE c.id_usuario = $1
     ORDER BY c.id_cuenta`,
    [id_usuario]
  );
  return r.rows;
}

export async function findById(id_cuenta, id_usuario) {
  const r = await query(
    'SELECT * FROM cuenta WHERE id_cuenta = $1 AND id_usuario = $2',
    [id_cuenta, id_usuario]
  );
  return r.rows[0] || null;
}

export async function create({ id_usuario, alias, saldo_inicial, moneda }) {
  const r = await query(
    `INSERT INTO cuenta (id_usuario, alias, saldo_inicial, moneda)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [id_usuario, alias, saldo_inicial, moneda || 'CLP']
  );
  return r.rows[0];
}

export async function update(id_cuenta, id_usuario, { alias, saldo_inicial, moneda }) {
  const r = await query(
    `UPDATE cuenta
     SET alias = COALESCE($1, alias),
         saldo_inicial = COALESCE($2, saldo_inicial),
         moneda = COALESCE($3, moneda)
     WHERE id_cuenta = $4 AND id_usuario = $5
     RETURNING *`,
    [alias, saldo_inicial, moneda, id_cuenta, id_usuario]
  );
  return r.rows[0] || null;
}

export async function remove(id_cuenta, id_usuario) {
  const r = await query(
    'DELETE FROM cuenta WHERE id_cuenta = $1 AND id_usuario = $2 RETURNING id_cuenta',
    [id_cuenta, id_usuario]
  );
  return r.rowCount > 0;
}
