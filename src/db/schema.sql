-- =====================================================
-- Sistema de Gestión Financiera Predictiva
-- Script DDL completo - PostgreSQL 14+
-- Corresponde al Anexo A del Informe Sumativo N°2
-- =====================================================

-- Limpia en caso de re-ejecución (orden inverso de dependencias)
DROP TABLE IF EXISTS alerta CASCADE;
DROP TABLE IF EXISTS presupuesto CASCADE;
DROP TABLE IF EXISTS transaccion CASCADE;
DROP TABLE IF EXISTS categoria CASCADE;
DROP TABLE IF EXISTS cuenta CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;
DROP TABLE IF EXISTS rol CASCADE;

-- ===========================
-- Tabla: rol
-- ===========================
CREATE TABLE rol (
    id_rol       SERIAL PRIMARY KEY,
    nombre       VARCHAR(30) NOT NULL UNIQUE
);

-- ===========================
-- Tabla: usuario
-- ===========================
CREATE TABLE usuario (
    id_usuario       SERIAL PRIMARY KEY,
    id_rol           INT NOT NULL,
    nombre           VARCHAR(100) NOT NULL,
    email            VARCHAR(100) NOT NULL UNIQUE,
    contrasena_hash  VARCHAR(255) NOT NULL,
    fecha_registro   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol)
        REFERENCES rol(id_rol) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ===========================
-- Tabla: cuenta
-- ===========================
CREATE TABLE cuenta (
    id_cuenta        SERIAL PRIMARY KEY,
    id_usuario       INT NOT NULL,
    alias            VARCHAR(50) NOT NULL,
    saldo_inicial    DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (saldo_inicial >= 0),
    moneda           CHAR(3) NOT NULL DEFAULT 'CLP',
    fecha_creacion   DATE NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT fk_cuenta_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario) ON DELETE RESTRICT
);

-- ===========================
-- Tabla: categoria
-- ===========================
CREATE TABLE categoria (
    id_categoria     SERIAL PRIMARY KEY,
    id_usuario       INT NOT NULL,
    nombre           VARCHAR(50) NOT NULL,
    tipo             CHAR(1) NOT NULL CHECK (tipo IN ('I','G')),
    color            VARCHAR(7),
    CONSTRAINT fk_categoria_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario) ON DELETE RESTRICT,
    CONSTRAINT uk_categoria_usuario_nombre UNIQUE (id_usuario, nombre)
);

-- ===========================
-- Tabla: transaccion
-- ===========================
CREATE TABLE transaccion (
    id_transaccion   SERIAL PRIMARY KEY,
    id_cuenta        INT NOT NULL,
    id_categoria     INT NOT NULL,
    tipo             CHAR(1) NOT NULL CHECK (tipo IN ('I','G')),
    monto            DECIMAL(12,2) NOT NULL CHECK (monto > 0),
    fecha            DATE NOT NULL,
    glosa            VARCHAR(200),
    creado_en        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_transaccion_cuenta FOREIGN KEY (id_cuenta)
        REFERENCES cuenta(id_cuenta) ON DELETE RESTRICT,
    CONSTRAINT fk_transaccion_categoria FOREIGN KEY (id_categoria)
        REFERENCES categoria(id_categoria) ON DELETE RESTRICT
);

-- ===========================
-- Tabla: presupuesto
-- ===========================
CREATE TABLE presupuesto (
    id_presupuesto   SERIAL PRIMARY KEY,
    id_usuario       INT NOT NULL,
    id_categoria     INT NOT NULL,
    monto_max        DECIMAL(12,2) NOT NULL CHECK (monto_max > 0),
    periodo          VARCHAR(10) NOT NULL CHECK (periodo IN ('SEMANAL','MENSUAL')),
    vigente_desde    DATE NOT NULL,
    CONSTRAINT fk_presupuesto_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario) ON DELETE RESTRICT,
    CONSTRAINT fk_presupuesto_categoria FOREIGN KEY (id_categoria)
        REFERENCES categoria(id_categoria) ON DELETE RESTRICT
);

-- ===========================
-- Tabla: alerta
-- ===========================
CREATE TABLE alerta (
    id_alerta        SERIAL PRIMARY KEY,
    id_usuario       INT NOT NULL,
    tipo             VARCHAR(30) NOT NULL,
    mensaje          VARCHAR(255) NOT NULL,
    fecha_generada   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    leida            BOOLEAN NOT NULL DEFAULT FALSE,
    severidad        VARCHAR(10) NOT NULL CHECK (severidad IN ('BAJA','MEDIA','ALTA')),
    CONSTRAINT fk_alerta_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario) ON DELETE CASCADE
);

-- ===========================
-- Índices secundarios
-- ===========================
CREATE INDEX idx_transaccion_cuenta_fecha ON transaccion(id_cuenta, fecha);
CREATE INDEX idx_transaccion_categoria   ON transaccion(id_categoria);
CREATE INDEX idx_alerta_usuario_leida    ON alerta(id_usuario, leida);

-- ===========================
-- Datos iniciales (catálogo de roles)
-- ===========================
INSERT INTO rol (nombre) VALUES ('Usuario'), ('Administrador');
