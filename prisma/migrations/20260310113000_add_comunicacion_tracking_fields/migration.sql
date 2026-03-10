-- AlterTable
ALTER TABLE "Comunicacion" ADD COLUMN "duracionMin" INTEGER;
ALTER TABLE "Comunicacion" ADD COLUMN "objetivo" TEXT;
ALTER TABLE "Comunicacion" ADD COLUMN "proximoPaso" TEXT;
ALTER TABLE "Comunicacion" ADD COLUMN "fechaProximaAccion" DATETIME;
ALTER TABLE "Comunicacion" ADD COLUMN "estadoSeguimiento" TEXT;
