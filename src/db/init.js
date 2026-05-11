import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pool from './pool.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function init() {
  try {
    console.log('Leyendo schema.sql...');
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');

    console.log('Ejecutando creación de tablas e índices...');
    await pool.query(schema);

    console.log('Base de datos inicializada correctamente.');
    console.log('Tablas creadas: rol, usuario, cuenta, categoria, transaccion, presupuesto, alerta');

    const result = await pool.query('SELECT id_rol, nombre FROM rol ORDER BY id_rol');
    console.log('Roles cargados:', result.rows);

    process.exit(0);
  } catch (err) {
    console.error('Error inicializando la base de datos:', err.message);
    process.exit(1);
  }
}

init();
