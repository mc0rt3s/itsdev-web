import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizarGasto } from '../src/lib/gastos-utils.ts';

test('iva solo se guarda con factura', () => {
  const f = normalizarGasto({ monto: 1190, iva: 190, moneda: 'CLP', tipoDocumento: 'factura' });
  assert.ok(f.ok);
  assert.equal(f.data.iva, 190);

  const b = normalizarGasto({ monto: 1190, iva: 190, moneda: 'CLP', tipoDocumento: 'boleta' });
  assert.ok(b.ok);
  assert.equal(b.data.iva, 0);
});

test('iva opcional: vacío queda en 0 con factura', () => {
  const r = normalizarGasto({ monto: 5000, moneda: 'CLP', tipoDocumento: 'factura' });
  assert.ok(r.ok);
  assert.equal(r.data.iva, 0);
});

test('moneda extranjera calcula CLP desde monto original', () => {
  const r = normalizarGasto({ monto: 0, moneda: 'USD', montoOriginal: 20, tipoCambio: 950, tipoDocumento: 'suscripcion' });
  assert.ok(r.ok);
  assert.equal(r.data.monto, 19000);
  assert.equal(r.data.montoOriginal, 20);
  assert.equal(r.data.iva, 0);
});

test('moneda extranjera exige monto original y tipo de cambio', () => {
  const r = normalizarGasto({ monto: 0, moneda: 'USD', tipoDocumento: 'suscripcion' });
  assert.equal(r.ok, false);
});
