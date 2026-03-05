import { Prisma } from '@prisma/client';

interface CotizacionItemInput {
  sku?: string | null;
  descripcion: string;
  cantidad: number;
  precioCompraUSD?: number | null;
  precioCompraCLP?: number | null;
  margenPorcentaje?: number | null;
  precioUnit: number;
  servicioId?: string | null;
}

export interface CotizacionItemWithTotal {
  sku: string | null;
  descripcion: string;
  cantidad: number;
  precioCompraUSD: number | null;
  precioCompraCLP: number | null;
  margenPorcentaje: number | null;
  precioUnit: number;
  total: number;
  servicioId: string | null;
}

export function buildCotizacionWhere(clienteId: string | null, estado: string | null): Prisma.CotizacionWhereInput {
  const where: Prisma.CotizacionWhereInput = {};
  if (clienteId) where.clienteId = clienteId;
  if (estado) where.estado = estado;
  return where;
}

export function resolveTipoCambioUSD(input: number | null | undefined, configValue: string | null | undefined): number {
  const fromInput = input ?? 0;
  if (fromInput > 0) return fromInput;

  const parsed = Number.parseFloat(configValue ?? '');
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  return 924;
}

export function calcularTotalesCotizacion(
  items: CotizacionItemInput[],
  descuento: number,
  aplicarIVA: boolean
): {
  itemsWithTotal: CotizacionItemWithTotal[];
  subtotal: number;
  impuesto: number;
  total: number;
} {
  let subtotal = 0;

  const itemsWithTotal = items.map((item) => {
    const itemTotal = item.cantidad * item.precioUnit;
    subtotal += itemTotal;

    return {
      sku: item.sku || null,
      descripcion: item.descripcion,
      cantidad: item.cantidad,
      precioCompraUSD: item.precioCompraUSD ?? null,
      precioCompraCLP: item.precioCompraCLP ?? null,
      margenPorcentaje: item.margenPorcentaje ?? null,
      precioUnit: item.precioUnit,
      total: itemTotal,
      servicioId: item.servicioId || null,
    };
  });

  const subtotalDescontado = Math.max(0, subtotal - descuento);
  const impuesto = aplicarIVA ? Math.round(subtotalDescontado * 0.19) : 0;
  const total = subtotalDescontado + impuesto;

  return {
    itemsWithTotal,
    subtotal,
    impuesto,
    total,
  };
}
