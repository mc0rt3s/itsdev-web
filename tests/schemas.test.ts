import test from 'node:test';
import assert from 'node:assert/strict';
import { accesoInformeSchema, cotizacionSchema } from '../src/lib/schemas.ts';

test('accesoInformeSchema rechaza correo inválido', () => {
  const result = accesoInformeSchema.safeParse({
    clienteId: 'cli_1',
    destinatario: 'correo-invalido',
  });

  assert.equal(result.success, false);
});

test('cotizacionSchema exige cliente o prospecto', () => {
  const result = cotizacionSchema.safeParse({
    numero: 'COT-001',
    fecha: new Date().toISOString(),
    validez: new Date().toISOString(),
    estado: 'borrador',
    moneda: 'CLP',
    descuento: 0,
    items: [
      {
        descripcion: 'Servicio base',
        cantidad: 1,
        precioUnit: 1000,
      },
    ],
  });

  assert.equal(result.success, false);
});
