# FinPredict — Backend

Backend del Sistema de Gestión Financiera Predictiva. API REST construida con Node.js 20 + Express.js, conectada a PostgreSQL 14+. Implementa autenticación con JWT + bcrypt, CRUD completo sobre 7 entidades, componente predictivo (regresión lineal + detección de anomalías μ + 1,5σ) y generación de reportes Excel.

## Requisitos

- Node.js 20 o superior
- PostgreSQL 14 o superior (local o Render)
- Cuenta de Gmail con contraseña de aplicación (opcional, para envío de correos)

## Instalación local

```bash
npm install
cp .env.example .env
# Edita .env con tus credenciales locales
npm run init-db
npm run dev
```

El servidor queda escuchando en `http://localhost:3000`.

## Variables de entorno

Ver `.env.example`. Las críticas son:

- `DATABASE_URL`: cadena de conexión PostgreSQL (la entrega Render automáticamente)
- `JWT_SECRET`: cadena aleatoria larga para firmar tokens
- `FRONTEND_URL`: URL pública del frontend en Vercel
- `SMTP_*`: credenciales de Gmail para envío de correos

## Endpoints principales

### Autenticación (públicos)
- `POST /api/auth/registro` — `{ nombre, email, contrasena }`
- `POST /api/auth/login` — `{ email, contrasena }` → `{ usuario, token }`
- `GET  /api/auth/me` — devuelve el usuario autenticado

Todos los endpoints siguientes requieren header `Authorization: Bearer <token>`.

### CRUD de entidades

| Recurso | Endpoints |
| --- | --- |
| Cuentas | `GET / POST /api/cuentas`, `PUT / DELETE /api/cuentas/:id` |
| Categorías | `GET / POST /api/categorias`, `PUT / DELETE /api/categorias/:id` |
| Transacciones | `GET / POST /api/transacciones`, `PUT / DELETE /api/transacciones/:id` |
| Presupuestos | `GET / POST /api/presupuestos`, `PUT / DELETE /api/presupuestos/:id` |
| Alertas | `GET /api/alertas`, `PUT /api/alertas/:id/leida` |

### Dashboard y reportes
- `GET /api/dashboard` — KPIs consolidados + predicción
- `GET /api/reportes/excel?desde=&hasta=` — descarga Excel
- `POST /api/reportes/email` — envía Excel al correo del usuario

## Estructura

```
src/
├── controllers/    # Reciben HTTP, delegan a servicios
├── services/       # Lógica de negocio (auth, predicción, reportes)
├── repositories/   # Acceso a datos (SQL parametrizado)
├── middlewares/    # Auth JWT, manejo de errores
├── db/             # Pool, schema.sql, init.js
├── routes/         # Definición de rutas REST
└── index.js        # Servidor Express
```

## Despliegue en Render

1. Crear servicio web en Render apuntando al repositorio GitHub
2. Build command: `npm install`
3. Start command: `npm start`
4. Crear base de datos PostgreSQL en Render (vincula automáticamente `DATABASE_URL`)
5. Definir las demás variables de entorno desde `.env.example`
6. Tras el primer deploy, ejecutar `npm run init-db` desde el shell de Render
