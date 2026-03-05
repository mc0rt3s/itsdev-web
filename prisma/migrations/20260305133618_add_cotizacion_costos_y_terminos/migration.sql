-- AlterTable
ALTER TABLE "ItemCotizacion" ADD COLUMN "margenPorcentaje" REAL;
ALTER TABLE "ItemCotizacion" ADD COLUMN "precioCompraCLP" REAL;
ALTER TABLE "ItemCotizacion" ADD COLUMN "precioCompraUSD" REAL;
ALTER TABLE "ItemCotizacion" ADD COLUMN "sku" TEXT;

-- CreateTable
CREATE TABLE "ConfigValor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Cotizacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT,
    "numero" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validez" DATETIME NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'borrador',
    "moneda" TEXT NOT NULL DEFAULT 'CLP',
    "subtotal" REAL NOT NULL,
    "impuesto" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL,
    "descuento" REAL NOT NULL DEFAULT 0,
    "notas" TEXT,
    "tipoCambioUSD" REAL,
    "modoEnvio" TEXT,
    "fechaEntrega" TEXT,
    "formaPago" TEXT,
    "duracionValidezDias" INTEGER,
    "nombreProspecto" TEXT,
    "emailProspecto" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Cotizacion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Cotizacion" ("clienteId", "createdAt", "emailProspecto", "estado", "fecha", "id", "impuesto", "moneda", "nombreProspecto", "notas", "numero", "subtotal", "total", "updatedAt", "validez") SELECT "clienteId", "createdAt", "emailProspecto", "estado", "fecha", "id", "impuesto", "moneda", "nombreProspecto", "notas", "numero", "subtotal", "total", "updatedAt", "validez" FROM "Cotizacion";
DROP TABLE "Cotizacion";
ALTER TABLE "new_Cotizacion" RENAME TO "Cotizacion";
CREATE UNIQUE INDEX "Cotizacion_numero_key" ON "Cotizacion"("numero");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ConfigValor_clave_key" ON "ConfigValor"("clave");
