import * as cuentaRepo from '../repositories/cuentaRepo.js';
import * as transaccionRepo from '../repositories/transaccionRepo.js';
import * as alertaRepo from '../repositories/alertaRepo.js';

/**
 * Calcula la fecha probable de agotamiento del saldo del usuario mediante
 * REGRESIÓN LINEAL SIMPLE (mínimos cuadrados) sobre la serie del saldo diario
 * reconstruida de los últimos 30 días.
 *
 * Modelo:  saldo(t) = b0 + b1 * t      (recta ajustada por mínimos cuadrados)
 *   - t: número de día (0 = hace 30 días ... 30 = hoy)
 *   - b1: pendiente (variación diaria del saldo). Si b1 < 0, el saldo decrece.
 *   - Día de agotamiento: t* tal que saldo(t*) = 0  ->  t* = -b0 / b1
 *   - dias_restantes = t* - t_hoy
 *
 * Severidad:
 *  - ALTA si el horizonte es <= 3 días
 *  - MEDIA si está entre 4 y 7 días
 *  - BAJA si supera los 7 días
 */
export async function predecirAgotamiento(id_usuario) {
  const VENTANA = 30;
  const cuentas = await cuentaRepo.listByUsuario(id_usuario);
  const saldoActual = cuentas.reduce((acc, c) => acc + parseFloat(c.saldo_actual), 0);

  // Serie de flujo neto diario de los últimos 30 días
  const flujos = await transaccionRepo.flujoNetoDiario(id_usuario, VENTANA);

  if (flujos.length < 2 || saldoActual <= 0) {
    const gastoDiario = await transaccionRepo.gastoDiarioPromedio(id_usuario, VENTANA);
    return {
      saldo_actual: saldoActual,
      gasto_diario_promedio: gastoDiario,
      pendiente: null,
      r_cuadrado: null,
      dias_restantes: null,
      fecha_agotamiento: null,
      severidad: null,
      mensaje: 'Datos insuficientes para realizar la predicción'
    };
  }

  // Reconstrucción de la serie del SALDO día a día (hacia atrás desde el saldo actual).
  // netoPorDia[d] = flujo neto del día con 'd' días de antigüedad (0 = hoy)
  const netoPorDia = {};
  for (const f of flujos) netoPorDia[f.dias_atras] = f.neto;

  // Puntos (t, saldo): t=VENTANA es hoy y t=0 es el día más antiguo.
  // saldo de días previos = saldo posterior - neto del día posterior.
  const puntos = [];
  let saldo = saldoActual;
  for (let d = 0; d <= VENTANA; d++) {
    const t = VENTANA - d;
    puntos.push({ t, saldo });
    const neto = netoPorDia[d + 1] || 0;
    saldo = saldo - neto;
  }

  // Regresión lineal por mínimos cuadrados: b1 = Σ((t-t̄)(y-ȳ)) / Σ((t-t̄)²)
  const n = puntos.length;
  const sumT = puntos.reduce((a, p) => a + p.t, 0);
  const sumY = puntos.reduce((a, p) => a + p.saldo, 0);
  const meanT = sumT / n;
  const meanY = sumY / n;
  let num = 0, den = 0, ssTot = 0;
  for (const p of puntos) {
    num += (p.t - meanT) * (p.saldo - meanY);
    den += (p.t - meanT) ** 2;
    ssTot += (p.saldo - meanY) ** 2;
  }
  const b1 = den === 0 ? 0 : num / den;   // pendiente (variación diaria del saldo)
  const b0 = meanY - b1 * meanT;          // intercepto

  // Coeficiente de determinación R² (calidad del ajuste de la recta)
  let ssRes = 0;
  for (const p of puntos) {
    const pred = b0 + b1 * p.t;
    ssRes += (p.saldo - pred) ** 2;
  }
  const rCuadrado = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  const gastoDiarioEstimado = b1 < 0 ? -b1 : 0;

  // Si la pendiente no es negativa, el saldo no decrece: sin agotamiento previsible
  if (b1 >= 0) {
    return {
      saldo_actual: saldoActual,
      gasto_diario_promedio: gastoDiarioEstimado,
      pendiente: b1,
      r_cuadrado: parseFloat(rCuadrado.toFixed(3)),
      dias_restantes: null,
      fecha_agotamiento: null,
      severidad: 'BAJA',
      mensaje: 'El saldo se mantiene estable o en aumento; no se proyecta agotamiento.'
    };
  }

  // Día (t*) en que la recta cruza saldo = 0:  t* = -b0 / b1
  const tCero = -b0 / b1;
  const diasRestantes = Math.max(0, Math.floor(tCero - VENTANA));
  const fechaAgotamiento = new Date();
  fechaAgotamiento.setDate(fechaAgotamiento.getDate() + diasRestantes);

  let severidad;
  if (diasRestantes <= 3) severidad = 'ALTA';
  else if (diasRestantes <= 7) severidad = 'MEDIA';
  else severidad = 'BAJA';

  return {
    saldo_actual: saldoActual,
    gasto_diario_promedio: gastoDiarioEstimado,
    pendiente: parseFloat(b1.toFixed(2)),
    r_cuadrado: parseFloat(rCuadrado.toFixed(3)),
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