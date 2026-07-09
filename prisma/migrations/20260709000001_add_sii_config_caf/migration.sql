-- CreateTable
CREATE TABLE "SiiConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "certBase64" TEXT NOT NULL,
    "certPassword" TEXT NOT NULL,
    "rutFirmante" TEXT NOT NULL,
    "rutEmpresa" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "giro" TEXT NOT NULL,
    "acteco" INTEGER NOT NULL,
    "direccion" TEXT NOT NULL,
    "comuna" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "fechaResolucion" TEXT NOT NULL,
    "numResolucion" INTEGER NOT NULL,
    "ambiente" TEXT NOT NULL DEFAULT 'certification',
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SiiCaf" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipoDte" INTEGER NOT NULL,
    "xml" TEXT NOT NULL,
    "folioDesde" INTEGER NOT NULL,
    "folioHasta" INTEGER NOT NULL,
    "folioActual" INTEGER NOT NULL DEFAULT 0,
    "ambiente" TEXT NOT NULL DEFAULT 'certification',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "SiiCaf_tipoDte_ambiente_key" ON "SiiCaf"("tipoDte", "ambiente");
