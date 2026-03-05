import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFacturaWhere, calcularTotalesFactura } from '../src/lib/facturas-utils.ts';

test('buildFacturaWhere arma filtros opcionales', () => {
  assert.deepEqual(buildFacturaWhere(null, null), {});
  assert.deepEqual(buildFacturaWhere('c1', null), { clienteId: 'c1' });
  assert.deepEqual(buildFacturaWhere(null, 'pagada'), { estado: 'pagada' });
  assert.deepEqual(buildFacturaWhere('c1', 'pagada'), { clienteId: 'c1', estado: 'pagada' });
});

test('calcularTotalesFactura calcula subtotal, iva y total', () => {
  const result = calcularTotalesFactura(
    [
      { descripcion: 'A', cantidad: 2, precioUnit: 1000 },
      { descripcion: 'B', cantidad: 1, precioUnit: 500 },
    ],
    true
  );

  assert.equal(result.subtotal, 2500);
  assert.equal(result.impuesto, 475);
  assert.equal(result.total, 2975);
  assert.equal(result.itemsWithTotal[0].total, 2000);
});
