import * as cuentaRepo from '../repositories/cuentaRepo.js';
import * as transaccionRepo from '../repositories/transaccionRepo.js';
import * as alertaRepo from '../repositories/alertaRepo.js';

/**
 * Calcula la fecha probable de agotamiento del saldo del usuario.
 * Algoritmo: dias_restantes = saldo_actual / gasto_diario_promedio
 * - saldo_actual: suma de saldos actuales de todas las cuentas
 * - gasto_diario_promedio: promedio de gastos en los últimos 30 días
 *
 * Severidad:
 *  - ALTA si el horizonte es <= 3 días
 *  - MEDIA si está entre 4 y 7 días
 *  - BAJA si supera los 7 días
 */
export async function predecirAgotamiento(id_usuario) {
  const cuentas = await cuentaRepo.listByUsuario(id_usuario);
  const saldoActual = cuentas.reduce((acc, c) => acc + parseFloat(c.saldo_actual), 0);
  const gastoDiario = await transaccionRepo.gastoDiarioPromedio(id_usuario, 30);

  if (gastoDiario <= 0 || saldoActual <= 0) {
    return {
      saldo_actual: saldoActual,
      gasto_diario_promedio: gastoDiario,
      dias_restantes: null,
      fecha_agotamiento: null,
      severidad: null,
      mensaje: 'Datos insuficientes para realizar la predicción'
    };
  }

  const diasRestantes = Math.floor(saldoActual / gastoDiario);
  const fechaAgotamiento = new Date();
  fechaAgotamiento.setDate(fechaAgotamiento.getDate() + diasRestantes);

  let severidad;
  if (diasRestantes <= 3) severidad = 'ALTA';
  else if (diasRestantes <= 7) severidad = 'MEDIA';
  else severidad = 'BAJA';

  return {
    saldo_actual: saldoActual,
    gasto_diario_promedio: gastoDiario,
    dias_restantes: diasRestantes,
    fecha_agotamiento: fechaAgotamiento.toISOString().split('T')[0],
    severidad,
    mensaje: `Saldo proyectado a agotarse en ${diasRestantes} días`
  };
}

/**
 * Genera alertas automáticas al usuario en función de la predicción.
 * Solo emite una alerta nueva por día por tipo (anti-spam).
 */
export async function generarAlertasAutomaticas(id_usuario) {
  const pred = await predecirAgotamiento(id_usuario);
  if (!pred.severidad) return [];
  const alertasGeneradas = [];

  // Alerta de agotamiento si severidad MEDIA o ALTA
  if (pred.severidad === 'ALTA' || pred.severidad === 'MEDIA') {
    const yaExiste = await alertaRepo.existeAlertaHoy(id_usuario, 'AGOTAMIENTO');
    if (!yaExiste) {
      const a = await alertaRepo.create({
        id_usuario,
        tipo: 'AGOTAMIENTO',
        mensaje: `${pred.mensaje}. Fecha proyectada: ${pred.fecha_agotamiento}.`,
        severidad: pred.severidad
      });
      alertasGeneradas.push(a);
    }
  }

  return alertasGeneradas;
}

/**
 * Verifica si una transacción específica es anómala según la regla μ + 1.5σ
 * Devuelve { esAnomalo, umbral, monto, mensaje }
 */
export async function evaluarAnomalia(id_usuario, id_categoria, monto) {
  const umbrales = await transaccionRepo.umbralAnomaliaPorCategoria(id_usuario, 90);
  const umbralCat = umbrales.find(u => u.id_categoria === id_categoria);
  if (!umbralCat) return { esAnomalo: false };
  const umbral = parseFloat(umbralCat.umbral);
  const esAnomalo = monto > umbral;
  return {
    esAnomalo,
    umbral,
    media: parseFloat(umbralCat.media),
    mensaje: esAnomalo
      ? `Gasto inusual detectado: supera el umbral histórico (μ + 1,5σ = $${umbral.toFixed(0)})`
      : null
  };
}
