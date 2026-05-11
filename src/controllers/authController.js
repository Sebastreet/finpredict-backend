import * as authService from '../services/authService.js';

export async function registrar(req, res, next) {
  try {
    const result = await authService.registrar(req.body);
    res.status(201).json(result);
  } catch (e) { next(e); }
}

export async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (e) { next(e); }
}

export async function me(req, res, next) {
  try {
    res.json({ usuario: req.user });
  } catch (e) { next(e); }
}
