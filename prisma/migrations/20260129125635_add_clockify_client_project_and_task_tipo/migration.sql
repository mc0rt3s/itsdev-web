-- AlterTable
ALTER TABLE "Proyecto" ADD COLUMN "clockifyProjectId" TEXT;

-- CreateTable
CREATE TABLE "ClockifyTaskTipo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clockifyTaskId" TEXT NOT NULL,
    "clockifyProjectId" TEXT,
    "nombre" TEXT NOT NULL,
    "tipoHora" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Cliente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rut" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "contacto" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "notas" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "clockifyClientId" TEXT,
    "facturaPorTiempo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Cliente" ("contacto", "createdAt", "email", "estado", "id", "notas", "razonSocial", "rut", "telefono", "updatedAt") SELECT "contacto", "createdAt", "email", "estado", "id", "notas", "razonSocial", "rut", "telefono", "updatedAt" FROM "Cliente";
DROP TABLE "Cliente";
ALTER TABLE "new_Cliente" RENAME TO "Cliente";
CREATE UNIQUE INDEX "Cliente_rut_key" ON "Cliente"("rut");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ClockifyTaskTipo_clockifyTaskId_key" ON "ClockifyTaskTipo"("clockifyTaskId");
