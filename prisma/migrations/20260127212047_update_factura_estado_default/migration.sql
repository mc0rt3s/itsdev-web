-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Factura" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "fechaEmision" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVenc" DATETIME NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'emitida',
    "moneda" TEXT NOT NULL DEFAULT 'CLP',
    "subtotal" REAL NOT NULL,
    "impuesto" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL,
    "notas" TEXT,
    "proyectoId" TEXT,
    "cotizacionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Factura_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Factura_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Factura_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Factura" ("clienteId", "cotizacionId", "createdAt", "estado", "fechaEmision", "fechaVenc", "id", "impuesto", "moneda", "notas", "numero", "proyectoId", "subtotal", "total", "updatedAt") SELECT "clienteId", "cotizacionId", "createdAt", "estado", "fechaEmision", "fechaVenc", "id", "impuesto", "moneda", "notas", "numero", "proyectoId", "subtotal", "total", "updatedAt" FROM "Factura";
DROP TABLE "Factura";
ALTER TABLE "new_Factura" RENAME TO "Factura";
CREATE UNIQUE INDEX "Factura_numero_key" ON "Factura"("numero");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
