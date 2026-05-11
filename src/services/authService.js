import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as usuarioRepo from '../repositories/usuarioRepo.js';
import { HttpError } from '../middlewares/errorHandler.js';

const SALT_ROUNDS = 10;
const ROL_USUARIO = 1;

export async function registrar({ nombre, email, contrasena }) {
  if (!nombre || !email || !contrasena) {
    throw new HttpError(400, 'Faltan campos obligatorios (nombre, email, contraseña)');
  }
  if (contrasena.length < 8) {
    throw new HttpError(400, 'La contraseña debe tener al menos 8 caracteres');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, 'El email no tiene un formato válido');
  }
  const existing = await usuarioRepo.findByEmail(email);
  if (existing) throw new HttpError(409, 'Ya existe una cuenta con ese correo');

  const contrasena_hash = await bcrypt.hash(contrasena, SALT_ROUNDS);
  const usuario = await usuarioRepo.create({
    id_rol: ROL_USUARIO,
    nombre,
    email: email.toLowerCase(),
    contrasena_hash
  });

  return { usuario, token: firmarToken(usuario) };
}

export async function login({ email, contrasena }) {
  if (!email || !contrasena) {
    throw new HttpError(400, 'Email y contraseña son obligatorios');
  }
  const usuario = await usuarioRepo.findByEmail(email.toLowerCase());
  if (!usuario) throw new HttpError(401, 'Credenciales inválidas');

  const match = await bcrypt.compare(contrasena, usuario.contrasena_hash);
  if (!match) throw new HttpError(401, 'Credenciales inválidas');

  const { contrasena_hash, ...usuarioSinHash } = usuario;
  return { usuario: usuarioSinHash, token: firmarToken(usuario) };
}

function firmarToken(usuario) {
  return jwt.sign(
    {
      id_usuario: usuario.id_usuario,
      id_rol: usuario.id_rol,
      email: usuario.email
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}
