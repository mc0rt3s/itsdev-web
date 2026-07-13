ALTER TABLE "Cotizacion" ADD COLUMN "tipo" TEXT NOT NULL DEFAULT 'cotizacion';
ALTER TABLE "Cotizacion" ADD COLUMN "titulo" TEXT;
ALTER TABLE "Cotizacion" ADD COLUMN "contexto" TEXT;
ALTER TABLE "Cotizacion" ADD COLUMN "alcance" TEXT;
ALTER TABLE "Cotizacion" ADD COLUMN "conceptoInversion" TEXT;
ALTER TABLE "Cotizacion" ADD COLUMN "condicionesGenerales" TEXT;
ALTER TABLE "Cotizacion" ADD COLUMN "plazoEstimado" TEXT;
ALTER TABLE "Cotizacion" ADD COLUMN "seccionesAdicionales" TEXT;
