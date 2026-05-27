import 'dotenv/config';
import bcrypt from 'bcrypt';
import pool from './pool.js';

const EMAIL = 'admin@finpredict.cl';
const PASSWORD = 'admin12345';

async function seedAdmin() {
  try {
    const hash = await bcrypt.hash(PASSWORD, 10);
    await pool.query(
      `INSERT INTO usuario (id_rol, nombre, email, contrasena_hash)
       VALUES (2, 'Administrador', $1, $2)
       ON CONFLICT (email) DO UPDATE SET contrasena_hash = $2, id_rol = 2`,
      [EMAIL, hash]
    );
    console.log('OK - Admin creado:', EMAIL, '/', PASSWORD);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

seedAdmin();