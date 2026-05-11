import * as cuentaRepo from '../repositories/cuentaRepo.js';
import * as transaccionRepo from '../repositories/transaccionRepo.js';
import { predecirAgotamiento } from '../services/prediccionService.js';

/**
 * Endpoint consolidado para el dashboard del usuario.
 * Devuelve KPIs, predicción y distribución por categoría en una sola petición.
 */
export async function dashboard(req, res, next) {
  try {
    const id_usuario = req.user.id_usuario;
    const [cuentas, totalesMes, distribucion, prediccion] = await Promise.all([
      cuentaRepo.listByUsuario(id_usuario),
      transaccionRepo.totalesDelMes(id_usuario),
      transaccionRepo.distribucionPorCategoria(id_usuario),
      predecirAgotamiento(id_usuario)
    ]);

    const saldoTotal = cuentas.reduce((acc, c) => acc + parseFloat(c.saldo_actual), 0);

    res.json({
      saldo_total: saldoTotal,
      total_cuentas: cuentas.length,
      ingresos_mes: totalesMes.ingresos,
      gastos_mes: totalesMes.gastos,
      balance_mes: totalesMes.ingresos - totalesMes.gastos,
      distribucion_categorias: distribucion,
      prediccion
    });
  } catch (e) { next(e); }
}
