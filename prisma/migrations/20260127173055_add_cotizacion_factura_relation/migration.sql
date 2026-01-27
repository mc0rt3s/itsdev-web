-- CreateTable
CREATE TABLE "Enlace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'otros',
    "descripcion" TEXT,
    "icono" TEXT NOT NULL DEFAULT 'link',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Servicio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" REAL NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'mensual',
    "categoria" TEXT NOT NULL DEFAULT 'general',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Suscripcion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT NOT NULL,
    "servicioId" TEXT NOT NULL,
    "precio" REAL NOT NULL,
    "ciclo" TEXT NOT NULL DEFAULT 'mensual',
    "fechaInicio" DATETIME NOT NULL,
    "fechaFin" DATETIME,
    "proxCobro" DATETIME,
    "estado" TEXT NOT NULL DEFAULT 'activa',
    "notas" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Suscripcion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Suscripcion_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Proyecto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'planificacion',
    "prioridad" TEXT NOT NULL DEFAULT 'media',
    "fechaInicio" DATETIME,
    "fechaFin" DATETIME,
    "presupuesto" REAL,
    "avance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Proyecto_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tarea" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "proyectoId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "prioridad" TEXT NOT NULL DEFAULT 'media',
    "fechaVenc" DATETIME,
    "asignadoAId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Tarea_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Tarea_asignadoAId_fkey" FOREIGN KEY ("asignadoAId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Factura" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "fechaEmision" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVenc" DATETIME NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
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

-- CreateTable
CREATE TABLE "ItemFactura" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "facturaId" TEXT NOT NULL,
    "servicioId" TEXT,
    "descripcion" TEXT NOT NULL,
    "cantidad" REAL NOT NULL DEFAULT 1,
    "precioUnit" REAL NOT NULL,
    "total" REAL NOT NULL,
    CONSTRAINT "ItemFactura_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Factura" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ItemFactura_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "facturaId" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metodo" TEXT NOT NULL,
    "referencia" TEXT,
    "notas" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pago_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Factura" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cotizacion" (
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
    "notas" TEXT,
    "nombreProspecto" TEXT,
    "emailProspecto" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Cotizacion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ItemCotizacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cotizacionId" TEXT NOT NULL,
    "servicioId" TEXT,
    "descripcion" TEXT NOT NULL,
    "cantidad" REAL NOT NULL DEFAULT 1,
    "precioUnit" REAL NOT NULL,
    "total" REAL NOT NULL,
    CONSTRAINT "ItemCotizacion_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ItemCotizacion_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Comunicacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resumen" TEXT NOT NULL,
    "detalle" TEXT,
    "resultado" TEXT,
    "usuarioId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Comunicacion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comunicacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Factura_numero_key" ON "Factura"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Cotizacion_numero_key" ON "Cotizacion"("numero");
