-- CreateEnum
CREATE TYPE "TipoHora" AS ENUM ('Normal', 'Descanso', 'Feriado', 'Otro');

-- CreateEnum
CREATE TYPE "EstadoTarea" AS ENUM ('Pendiente', 'En Progreso', 'Completada', 'Cancelada');

-- CreateEnum
CREATE TYPE "EstadoCliente" AS ENUM ('Activo', 'Inactivo', 'Suspendido');

-- CreateEnum
CREATE TYPE "EstadoProyecto" AS ENUM ('Activo', 'Inactivo', 'Completado', 'Suspendido');

-- CreateTable
CREATE TABLE "Acceso" (
    "id" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "contacto" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "notas" TEXT,
    "estado" "EstadoCliente" NOT NULL DEFAULT 'Activo',
    "clockifyClientId" TEXT,
    "kimaiCustomerId" TEXT,
    "facturaPorTiempo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proyecto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "clienteId" TEXT NOT NULL,
    "estado" "EstadoProyecto" NOT NULL DEFAULT 'Activo',
    "clockifyProjectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    PRIMARY KEY ("id"),
    CONSTRAINT "Proyecto_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tarea" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "proyectoId" TEXT NOT NULL,
    "estado" "EstadoTarea" NOT NULL DEFAULT 'Pendiente',
    "fechaVencimiento" TIMESTAMP(3),
    "asignado" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    PRIMARY KEY ("id"),
    CONSTRAINT "Tarea_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Survey" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyResponse" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "pregunta1" TEXT,
    "pregunta2" TEXT,
    "pregunta3" TEXT,
    "pregunta4" TEXT,
    "pregunta5" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    PRIMARY KEY ("id"),
    CONSTRAINT "SurveyResponse_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Acceso_usuario_key" ON "Acceso"("usuario");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_rut_key" ON "Cliente"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_clockifyClientId_key" ON "Cliente"("clockifyClientId");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_kimaiCustomerId_key" ON "Cliente"("kimaiCustomerId");

-- CreateIndex
CREATE INDEX "Proyecto_clienteId_idx" ON "Proyecto"("clienteId");

-- CreateIndex
CREATE INDEX "Tarea_proyectoId_idx" ON "Tarea"("proyectoId");

-- CreateIndex
CREATE INDEX "SurveyResponse_surveyId_idx" ON "SurveyResponse"("surveyId");
