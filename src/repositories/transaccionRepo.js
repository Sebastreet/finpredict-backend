import { query } from '../db/pool.js';

// Lista transacciones del usuario con filtros opcionales
export async function listByUsuario(id_usuario, filtros = {}) {
  const params = [id_usuario];
  let sql = `
    SELECT t.id_transaccion, t.id_cuenta, t.id_categoria, t.tipo, t.monto,
           t.fecha, t.glosa, t.creado_en,
           c.alias AS cuenta_alias, cat.nombre AS categoria_nombre,
           cat.color AS categoria_color
    FROM transaccion t
    JOIN cuenta c ON c.id_cuenta = t.id_cuenta
    JOIN categoria cat ON cat.id_categoria = t.id_categoria
    WHERE c.id_usuario = $1
  `;
  if (filtros.id_cuenta) { params.push(filtros.id_cuenta); sql += ` AND t.id_cuenta = $${params.length}`; }
  if (filtros.id_categoria) { params.push(filtros.id_categoria); sql += ` AND t.id_categoria = $${params.length}`; }
  if (filtros.tipo) { params.push(filtros.tipo); sql += ` AND t.tipo = $${params.length}`; }
  if (filtros.desde) { params.push(filtros.desde); sql += ` AND t.fecha >= $${params.length}`; }
  if (filtros.hasta) { params.push(filtros.hasta); sql += ` AND t.fecha <= $${params.length}`; }
  sql += ' ORDER BY t.fecha DESC, t.id_transaccion DESC';
  if (filtros.limit) { params.push(parseInt(filtros.limit)); sql += ` LIMIT $${params.length}`; }
  const r = await query(sql, params);
  return r.rows;
}

export async function findById(id_transaccion, id_usuario) {
  const r = await query(
    `SELECT t.* FROM transaccion t
     JOIN cuenta c ON c.id_cuenta = t.id_cuenta
     WHERE t.id_transaccion = $1 AND c.id_usuario = $2`,
    [id_transaccion, id_usuario]
  );
  return r.rows[0] || null;
}

export async function create({ id_cuenta, id_categoria, tipo, monto, fecha, glosa }) {
  const r = await query(
    `INSERT INTO transaccion (id_cuenta, id_categoria, tipo, monto, fecha, glosa)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [id_cuenta, id_categoria, tipo, monto, fecha, glosa || null]
  );
  return r.rows[0];
}

export async function update(id_transaccion, id_usuario, datos) {
  const t = await findById(id_transaccion, id_usuario);
  if (!t) return null;
  const r = await query(
    `UPDATE transaccion
     SET id_cuenta = COALESCE($1, id_cuenta),
         id_categoria = COALESCE($2, id_categoria),
         tipo = COALESCE($3, tipo),
         monto = COALESCE($4, monto),
         fecha = COALESCE($5, fecha),
         glosa = COALESCE($6, glosa)
     WHERE id_transaccion = $7 RETURNING *`,
    [datos.id_cuenta, datos.id_categoria, datos.tipo, datos.monto, datos.fecha, datos.glosa, id_transaccion]
  );
  return r.rows[0] || null;
}

export async function remove(id_transaccion, id_usuario) {
  const t = await findById(id_transaccion, id_usuario);
  if (!t) return false;
  await query('DELETE FROM transaccion WHERE id_transaccion = $1', [id_transaccion]);
  return true;
}

// Gasto diario promedio sobre los últimos N días (default 30)
export async function gastoDiarioPromedio(id_usuario, dias = 30) {
  const r = await query(
    `SELECT COALESCE(SUM(t.monto), 0) / $2::float AS promedio_diario
     FROM transaccion t
     JOIN cuenta c ON c.id_cuenta = t.id_cuenta
     WHERE c.id_usuario = $1
       AND t.tipo = 'G'
       AND t.fecha >= CURRENT_DATE - $2::int * INTERVAL '1 day'`,
    [id_usuario, dias]
  );
  return parseFloat(r.rows[0].promedio_diario) || 0;
}

// Serie temporal de flujo neto diario (ingresos - gastos) agrupado por día,
// últimos N días. Usada para ajustar la regresión lineal del saldo proyectado.
export async function flujoNetoDiario(id_usuario, dias = 30) {
  const r = await query(
    `SELECT (CURRENT_DATE - t.fecha)::int AS dias_atras,
            SUM(CASE WHEN t.tipo = 'I' THEN t.monto ELSE -t.monto END) AS neto
     FROM transaccion t
     JOIN cuenta c ON c.id_cuenta = t.id_cuenta
     WHERE c.id_usuario = $1
       AND t.fecha >= CURRENT_DATE - $2::int * INTERVAL '1 day'
     GROUP BY t.fecha
     ORDER BY t.fecha`,
    [id_usuario, dias]
  );
  return r.rows.map((row) => ({
    dias_atras: parseInt(row.dias_atras, 10),
    neto: parseFloat(row.neto)
  }));
}

// Detección de anomalía: media + 1.5*desviación estándar por categoría
export async function umbralAnomaliaPorCategoria(id_usuario, dias = 90) {
  const r = await query(
    `SELECT t.id_categoria,
            AVG(t.monto) AS media,
            COALESCE(STDDEV_SAMP(t.monto), 0) AS desv,
            AVG(t.monto) + 1.5 * COALESCE(STDDEV_SAMP(t.monto), 0) AS umbral,
            COUNT(*) AS n
     FROM transaccion t
     JOIN cuenta c ON c.id_cuenta = t.id_cuenta
     WHERE c.id_usuario = $1
       AND t.tipo = 'G'
       AND t.fecha >= CURRENT_DATE - $2::int * INTERVAL '1 day'
     GROUP BY t.id_categoria
     HAVING COUNT(*) >= 10`,
    [id_usuario, dias]
  );
  return r.rows;
}

// Suma de ingresos / gastos del mes actual
export async function totalesDelMes(id_usuario) {
  const r = await query(
    `SELECT
       COALESCE(SUM(CASE WHEN t.tipo = 'I' THEN t.monto ELSE 0 END), 0) AS ingresos,
       COALESCE(SUM(CASE WHEN t.tipo = 'G' THEN t.monto ELSE 0 END), 0) AS gastos
     FROM transaccion t
     JOIN cuenta c ON c.id_cuenta = t.id_cuenta
     WHERE c.id_usuario = $1
       AND DATE_TRUNC('month', t.fecha) = DATE_TRUNC('month', CURRENT_DATE)`,
    [id_usuario]
  );
  return {
    ingresos: parseFloat(r.rows[0].ingresos),
    gastos: parseFloat(r.rows[0].gastos)
  };
}

// Distribución de gastos por categoría (mes actual)
export async function distribucionPorCategoria(id_usuario) {
  const r = await query(
    `SELECT cat.nombre, cat.color, SUM(t.monto)::float AS total
     FROM transaccion t
     JOIN cuenta c ON c.id_cuenta = t.id_cuenta
     JOIN categoria cat ON cat.id_categoria = t.id_categoria
     WHERE c.id_usuario = $1 AND t.tipo = 'G'
       AND DATE_TRUNC('month', t.fecha) = DATE_TRUNC('month', CURRENT_DATE)
     GROUP BY cat.nombre, cat.color
     ORDER BY total DESC`,
    [id_usuario]
  );
  return r.rows;
}