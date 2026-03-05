import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCotizacionWhere,
  calcularTotalesCotizacion,
  resolveTipoCambioUSD,
} from '../src/lib/cotizaciones-utils.ts';

test('buildCotizacionWhere arma filtros opcionales', () => {
  assert.deepEqual(buildCotizacionWhere(null, null), {});
  assert.deepEqual(buildCotizacionWhere('c1', 'borrador'), { clienteId: 'c1', estado: 'borrador' });
});

test('resolveTipoCambioUSD prioriza input y usa fallback seguro', () => {
  assert.equal(resolveTipoCambioUSD(950, '1000'), 950);
  assert.equal(resolveTipoCambioUSD(null, '980.5'), 980.5);
  assert.equal(resolveTipoCambioUSD(undefined, 'invalido'), 924);
});

test('calcularTotalesCotizacion aplica descuento e iva', () => {
  const result = calcularTotalesCotizacion(
    [
      { descripcion: 'Item 1', cantidad: 2, precioUnit: 1000 },
      { descripcion: 'Item 2', cantidad: 1, precioUnit: 3000 },
    ],
    500,
    true
  );

  // subtotal bruto = 5000, base neta = 4500
  assert.equal(result.subtotal, 5000);
  assert.equal(result.impuesto, 855);
  assert.equal(result.total, 5355);
  assert.equal(result.itemsWithTotal.length, 2);
});
