import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3000;

// CORS: permitir el frontend en producción + localhost en desarrollo
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir peticiones sin origin (curl, herramientas internas)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`Origin no permitido por CORS: ${origin}`));
  },
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging básico de peticiones
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Página raíz
app.get('/', (_req, res) => {
  res.json({
    nombre: 'FinPredict API',
    version: '1.0.0',
    descripcion: 'Sistema de Gestión Financiera Predictiva — Backend',
    endpoints_principales: [
      'POST /api/auth/registro',
      'POST /api/auth/login',
      'GET  /api/dashboard',
      'GET  /api/cuentas',
      'GET  /api/transacciones',
      'GET  /api/alertas',
      'GET  /api/reportes/excel'
    ]
  });
});

// API REST bajo /api
app.use('/api', routes);

// 404 para rutas no definidas
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` });
});

// Manejo central de errores
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`FinPredict API corriendo en puerto ${PORT}`);
  console.log(`Modo: ${process.env.NODE_ENV || 'desarrollo'}`);
  console.log(`Frontend URL permitido: ${process.env.FRONTEND_URL || '(no configurado)'}`);
});
