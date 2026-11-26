import { Prisma } from '@prisma/client';

interface FacturaItemInput {
  descripcion: string;
  cantidad: number;
  precioUnit: number;
  servicioId?: string | null;
}

export interface FacturaItemWithTotal extends FacturaItemInput {
  total: number;
}

export function buildFacturaWhere(clienteId: string | null, estado: string | null): Prisma.FacturaWhereInput {
  const where: Prisma.FacturaWhereInput = {};
  if (clienteId) where.clienteId = clienteId;
  if (estado) where.estado = estado;
  return where;
}

// Todas las facturas son afectas a IVA (19%). No existen facturas exentas.
export function calcularTotalesFactura(items: FacturaItemInput[]): {
  itemsWithTotal: FacturaItemWithTotal[];
  subtotal: number;
  impuesto: number;
  total: number;
} {
  let subtotal = 0;
  const itemsWithTotal = items.map((item) => {
    const itemTotal = item.cantidad * item.precioUnit;
    subtotal += itemTotal;
    return {
      ...item,
      total: itemTotal,
    };
  });

  const impuesto = Math.round(subtotal * 0.19);
  const total = subtotal + impuesto;

  return {
    itemsWithTotal,
    subtotal,
    impuesto,
    total,
  };
}
