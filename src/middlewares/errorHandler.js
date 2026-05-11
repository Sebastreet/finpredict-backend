// Middleware central de manejo de errores.
// Captura errores de validación, FK, CHECK, UNIQUE de PostgreSQL
// y devuelve respuestas HTTP semánticas.
export function errorHandler(err, req, res, next) {
  console.error('Error capturado:', err.message);

  // Errores específicos de PostgreSQL
  if (err.code === '23505') {
    // unique_violation
    return res.status(409).json({
      error: 'Ya existe un registro con esos datos',
      detail: err.detail
    });
  }
  if (err.code === '23503') {
    // foreign_key_violation
    return res.status(409).json({
      error: 'Existen registros relacionados que impiden la operación',
      detail: err.detail
    });
  }
  if (err.code === '23514') {
    // check_violation
    return res.status(400).json({
      error: 'Valor no permitido por las reglas del sistema',
      detail: err.detail
    });
  }
  if (err.code === '23502') {
    // not_null_violation
    return res.status(400).json({
      error: 'Falta un campo obligatorio',
      detail: err.column
    });
  }

  // Errores con status explícito (lanzados por servicios)
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }

  res.status(500).json({ error: 'Error interno del servidor' });
}

// Helper para lanzar errores HTTP en servicios
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
