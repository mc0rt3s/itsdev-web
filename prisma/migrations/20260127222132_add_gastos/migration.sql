-- CreateTable
CREATE TABLE "Gasto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "monto" REAL NOT NULL,
    "motivo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proveedor" TEXT,
    "comprobante" TEXT,
    "notas" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
