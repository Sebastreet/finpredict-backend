/**
 * Script para cargar datos demo (opcional).
 * Crea un usuario demo con cuentas, categorías y transacciones de los últimos 60 días.
 *
 * Uso:
 *   node src/db/seed.js
 *
 * Credenciales generadas:
 *   Email:      demo@finpredict.cl
 *   Contraseña: demo12345
 */
import 'dotenv/config';
import bcrypt from 'bcrypt';
import pool from './pool.js';

const EMAIL = 'demo@finpredict.cl';
const PASSWORD = 'demo12345';

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Limpiando datos demo previos...');
    const ex = await client.query('SELECT id_usuario FROM usuario WHERE email = $1', [EMAIL]);
    if (ex.rows.length) {
      const id = ex.rows[0].id_usuario;
      await client.query('DELETE FROM alerta WHERE id_usuario = $1', [id]);
      await client.query('DELETE FROM transaccion WHERE id_cuenta IN (SELECT id_cuenta FROM cuenta WHERE id_usuario = $1)', [id]);
      await client.query('DELETE FROM presupuesto WHERE id_usuario = $1', [id]);
      await client.query('DELETE FROM categoria WHERE id_usuario = $1', [id]);
      await client.query('DELETE FROM cuenta WHERE id_usuario = $1', [id]);
      await client.query('DELETE FROM usuario WHERE id_usuario = $1', [id]);
    }

    console.log('Creando usuario demo...');
    const hash = await bcrypt.hash(PASSWORD, 10);
    const u = await client.query(
      `INSERT INTO usuario (id_rol, nombre, email, contrasena_hash)
       VALUES (1, 'Usuario Demo', $1, $2) RETURNING id_usuario`,
      [EMAIL, hash]
    );
    const idUsuario = u.rows[0].id_usuario;

    console.log('Creando cuentas...');
    const c1 = await client.query(
      `INSERT INTO cuenta (id_usuario, alias, saldo_inicial, moneda)
       VALUES ($1, 'BancoEstado Vista', 450000, 'CLP') RETURNING id_cuenta`, [idUsuario]);
    const c2 = await client.query(
      `INSERT INTO cuenta (id_usuario, alias, saldo_inicial, moneda)
       VALUES ($1, 'Tarjeta Crédito', 0, 'CLP') RETURNING id_cuenta`, [idUsuario]);

    console.log('Creando categorías...');
    const cats = {};
    const catData = [
      ['Sueldo', 'I', '#16A34A'],
      ['Otros ingresos', 'I', '#0EA5E9'],
      ['Alimentación', 'G', '#DC2626'],
      ['Transporte', 'G', '#F59E0B'],
      ['Servicios', 'G', '#1F3864'],
      ['Entretenimiento', 'G', '#8B5CF6'],
      ['Salud', 'G', '#EC4899']
    ];
    for (const [nombre, tipo, color] of catData) {
      const r = await client.query(
        `INSERT INTO categoria (id_usuario, nombre, tipo, color)
         VALUES ($1, $2, $3, $4) RETURNING id_categoria`,
        [idUsuario, nombre, tipo, color]);
      cats[nombre] = r.rows[0].id_categoria;
    }

    console.log('Generando transacciones de los últimos 60 días...');
    const hoy = new Date();
    const trans = [];
    // Sueldo el día 1 de cada mes
    for (let mes = 0; mes < 2; mes++) {
      const d = new Date(hoy);
      d.setMonth(d.getMonth() - mes);
      d.setDate(1);
      trans.push([c1.rows[0].id_cuenta, cats['Sueldo'], 'I', 1250000, d.toISOString().split('T')[0], 'Sueldo mensual']);
    }
    // Gastos diarios variables
    const gastosCat = ['Alimentación', 'Transporte', 'Servicios', 'Entretenimiento', 'Salud'];
    for (let dia = 0; dia < 60; dia++) {
      const d = new Date(hoy);
      d.setDate(d.getDate() - dia);
      const fecha = d.toISOString().split('T')[0];
      // 1-3 gastos por día
      const n = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < n; i++) {
        const cat = gastosCat[Math.floor(Math.random() * gastosCat.length)];
        const cuenta = Math.random() < 0.5 ? c1.rows[0].id_cuenta : c2.rows[0].id_cuenta;
        const monto = Math.floor(2000 + Math.random() * 35000);
        trans.push([cuenta, cats[cat], 'G', monto, fecha, `${cat} - movimiento`]);
      }
    }

    for (const t of trans) {
      await client.query(
        `INSERT INTO transaccion (id_cuenta, id_categoria, tipo, monto, fecha, glosa)
         VALUES ($1, $2, $3, $4, $5, $6)`, t);
    }

    console.log('Creando presupuestos...');
    const fechaInicioMes = new Date();
    fechaInicioMes.setDate(1);
    await client.query(
      `INSERT INTO presupuesto (id_usuario, id_categoria, monto_max, periodo, vigente_desde)
       VALUES ($1, $2, 300000, 'MENSUAL', $3)`,
      [idUsuario, cats['Alimentación'], fechaInicioMes.toISOString().split('T')[0]]);
    await client.query(
      `INSERT INTO presupuesto (id_usuario, id_categoria, monto_max, periodo, vigente_desde)
       VALUES ($1, $2, 150000, 'MENSUAL', $3)`,
      [idUsuario, cats['Transporte'], fechaInicioMes.toISOString().split('T')[0]]);

    await client.query('COMMIT');
    console.log('\n✓ Datos demo cargados exitosamente.');
    console.log(`  Email: ${EMAIL}`);
    console.log(`  Contraseña: ${PASSWORD}`);
    console.log(`  Cuentas: 2 | Categorías: 7 | Transacciones: ${trans.length} | Presupuestos: 2\n`);
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

seed();
