import jwt from 'jsonwebtoken';

// Verifica que la petición traiga un token JWT válido en el header Authorization.
// Si es válido, agrega req.user con { id_usuario, id_rol, email } y deja pasar.
// Si no, devuelve 401.
export function autenticar(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: 'Token no provisto' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id_usuario: payload.id_usuario,
      id_rol: payload.id_rol,
      email: payload.email
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// Restringe el acceso a usuarios con un rol específico.
// Uso: router.get('/admin', autenticar, requireRol(2), handler)
export function requireRol(idRol) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'No autenticado' });
    if (req.user.id_rol !== idRol) {
      return res.status(403).json({ error: 'Permiso insuficiente' });
    }
    next();
  };
}
