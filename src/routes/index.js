import { Router } from 'express';
import { autenticar } from '../middlewares/auth.js';
import * as auth from '../controllers/authController.js';
import * as cuenta from '../controllers/cuentaController.js';
import * as categoria from '../controllers/categoriaController.js';
import * as transaccion from '../controllers/transaccionController.js';
import * as presupuesto from '../controllers/presupuestoController.js';
import * as alerta from '../controllers/alertaController.js';
import * as dashboard from '../controllers/dashboardController.js';
import * as reporte from '../controllers/reporteController.js';

const router = Router();

// Health check
router.get('/health', (_req, res) => res.json({ ok: true, timestamp: new Date() }));

// Autenticación (públicas)
router.post('/auth/registro', auth.registrar);
router.post('/auth/login', auth.login);
router.get('/auth/me', autenticar, auth.me);

// Cuentas
router.get('/cuentas', autenticar, cuenta.listar);
router.post('/cuentas', autenticar, cuenta.crear);
router.put('/cuentas/:id', autenticar, cuenta.actualizar);
router.delete('/cuentas/:id', autenticar, cuenta.eliminar);

// Categorías
router.get('/categorias', autenticar, categoria.listar);
router.post('/categorias', autenticar, categoria.crear);
router.put('/categorias/:id', autenticar, categoria.actualizar);
router.delete('/categorias/:id', autenticar, categoria.eliminar);

// Transacciones
router.get('/transacciones', autenticar, transaccion.listar);
router.post('/transacciones', autenticar, transaccion.crear);
router.put('/transacciones/:id', autenticar, transaccion.actualizar);
router.delete('/transacciones/:id', autenticar, transaccion.eliminar);

// Presupuestos
router.get('/presupuestos', autenticar, presupuesto.listar);
router.post('/presupuestos', autenticar, presupuesto.crear);
router.put('/presupuestos/:id', autenticar, presupuesto.actualizar);
router.delete('/presupuestos/:id', autenticar, presupuesto.eliminar);

// Alertas
router.get('/alertas', autenticar, alerta.listar);
router.put('/alertas/:id/leida', autenticar, alerta.marcarLeida);

// Dashboard consolidado
router.get('/dashboard', autenticar, dashboard.dashboard);

// Reportes
router.get('/reportes/excel', autenticar, reporte.descargarExcel);
router.post('/reportes/email', autenticar, reporte.enviarPorCorreo);

export default router;
