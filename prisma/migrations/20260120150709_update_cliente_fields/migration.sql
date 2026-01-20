/*
  Warnings:

  - You are about to drop the column `empresa` on the `Cliente` table. All the data in the column will be lost.
  - You are about to drop the column `nombre` on the `Cliente` table. All the data in the column will be lost.
  - Added the required column `razonSocial` to the `Cliente` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rut` to the `Cliente` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Acceso" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "url" TEXT,
    "usuario" TEXT,
    "password" TEXT,
    "notas" TEXT,
    "clienteId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Acceso_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Acceso" ("clienteId", "createdAt", "id", "nombre", "notas", "password", "tipo", "updatedAt", "url", "usuario") SELECT "clienteId", "createdAt", "id", "nombre", "notas", "password", "tipo", "updatedAt", "url", "usuario" FROM "Acceso";
DROP TABLE "Acceso";
ALTER TABLE "new_Acceso" RENAME TO "Acceso";
CREATE TABLE "new_Cliente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rut" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "contacto" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "notas" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Cliente" ("createdAt", "email", "estado", "id", "notas", "telefono", "updatedAt") SELECT "createdAt", "email", "estado", "id", "notas", "telefono", "updatedAt" FROM "Cliente";
DROP TABLE "Cliente";
ALTER TABLE "new_Cliente" RENAME TO "Cliente";
CREATE UNIQUE INDEX "Cliente_rut_key" ON "Cliente"("rut");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
