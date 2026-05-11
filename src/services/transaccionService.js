import * as transaccionRepo from '../repositories/transaccionRepo.js';
import * as cuentaRepo from '../repositories/cuentaRepo.js';
import * as categoriaRepo from '../repositories/categoriaRepo.js';
import * as alertaRepo from '../repositories/alertaRepo.js';
import { evaluarAnomalia, generarAlertasAutomaticas } from './prediccionService.js';
import { HttpError } from '../middlewares/errorHandler.js';

export async function crear(id_usuario, datos) {
  const { id_cuenta, id_categoria, tipo, monto, fecha, glosa } = datos;
  if (!id_cuenta || !id_categoria || !tipo || !monto || !fecha) {
    throw new HttpError(400, 'Faltan campos: id_cuenta, id_categoria, tipo, monto, fecha');
  }
  if (!['I', 'G'].includes(tipo)) throw new HttpError(400, "El tipo debe ser 'I' o 'G'");
  if (parseFloat(monto) <= 0) throw new HttpError(400, 'El monto debe ser positivo');

  // Verificar pertenencia: la cuenta y la categoría deben ser del usuario
  const cuenta = await cuentaRepo.findById(id_cuenta, id_usuario);
  if (!cuenta) throw new HttpError(404, 'La cuenta no existe o no pertenece al usuario');
  const categoria = await categoriaRepo.findById(id_categoria, id_usuario);
  if (!categoria) throw new HttpError(404, 'La categoría no existe o no pertenece al usuario');

  const transaccion = await transaccionRepo.create({ id_cuenta, id_categoria, tipo, monto, fecha, glosa });

  // Si es gasto, evaluar anomalía y generar alerta in-app si corresponde
  if (tipo === 'G') {
    const evalAnomalia = await evaluarAnomalia(id_usuario, id_categoria, parseFloat(monto));
    if (evalAnomalia.esAnomalo) {
      await alertaRepo.create({
        id_usuario,
        tipo: 'GASTO_ANOMALO',
        mensaje: `Gasto inusual en ${categoria.nombre}: $${parseFloat(monto).toFixed(0)}. ${evalAnomalia.mensaje}`,
        severidad: 'MEDIA'
      });
    }
    // Recalcular alertas de agotamiento (no falla si hay error)
    generarAlertasAutomaticas(id_usuario).catch(err =>
      console.error('Error generando alertas automáticas:', err.message));
  }

  return transaccion;
}

export async function listar(id_usuario, filtros) {
  return await transaccionRepo.listByUsuario(id_usuario, filtros);
}

export async function actualizar(id_usuario, id_transaccion, datos) {
  if (datos.tipo && !['I', 'G'].includes(datos.tipo)) {
    throw new HttpError(400, "El tipo debe ser 'I' o 'G'");
  }
  if (datos.monto !== undefined && parseFloat(datos.monto) <= 0) {
    throw new HttpError(400, 'El monto debe ser positivo');
  }
  const t = await transaccionRepo.update(id_transaccion, id_usuario, datos);
  if (!t) throw new HttpError(404, 'Transacción no encontrada');
  return t;
}

export async function eliminar(id_usuario, id_transaccion) {
  const ok = await transaccionRepo.remove(id_transaccion, id_usuario);
  if (!ok) throw new HttpError(404, 'Transacción no encontrada');
  return { ok: true };
}
