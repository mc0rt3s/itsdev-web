import prisma from '../src/lib/prisma';

async function main() {
  console.log('Creando cotización de prueba...');

  // Crear cliente
  const cliente = await prisma.cliente.create({
    data: {
      rut: '76.732.709-9',
      razonSocial: 'Cliente Test LTDA',
      contacto: 'Juan Pérez',
      email: 'juan@cliente.cl',
    },
  });

  // Crear cotización
  const cotizacion = await prisma.cotizacion.create({
    data: {
      numero: 'COT-2024-001',
      tipo: 'cotizacion',
      titulo: 'Cotización Test',
      fecha: new Date(),
      validez: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      duracionValidezDias: 30,
      clienteId: cliente.id,
      nombreProspecto: 'Juan Pérez',
      emailProspecto: 'juan@cliente.cl',
      subtotal: 1000000,
      impuesto: 190000,
      total: 1190000,
      moneda: 'CLP',
      formaPago: 'Transferencia',
      modoEnvio: 'Email',
      estado: 'enviada',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Crear items
  await prisma.itemCotizacion.create({
    data: {
      cotizacionId: cotizacion.id,
      sku: 'SRV-001',
      descripcion: 'Servicio de desarrollo web',
      cantidad: 1,
      precioUnit: 1000000,
      total: 1000000,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log('✓ Cotización de prueba creada:', cotizacion.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
