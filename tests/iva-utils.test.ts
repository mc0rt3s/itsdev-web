import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rangoMesChile, resumenIva } from '../src/lib/iva-utils';

test('rango octubre 2026 en Chile: inicio 00:00 local, fin 00:00 nov local', () => {
    const { desde, hasta } = rangoMesChile(2026, 10);
    // Octubre 2026 en Chile: horario de verano (UTC-3) desde el primer sábado de septiembre
    assert.equal(desde.toISOString(), '2026-10-01T03:00:00.000Z');
    assert.equal(hasta.toISOString(), '2026-11-01T03:00:00.000Z');
});

test('rango enero (verano Chile, UTC-3) usa offset correcto', () => {
    const { desde } = rangoMesChile(2026, 1);
    assert.equal(desde.toISOString(), '2026-01-01T03:00:00.000Z');
});

test('resumenIva: débito - crédito, redondeado', () => {
    const r = resumenIva([{ impuesto: 1900 }, { impuesto: 950.4 }], [{ iva: 400 }, { iva: null }]);
    assert.equal(r.debito, 2850);
    assert.equal(r.credito, 400);
    assert.equal(r.saldo, 2450);
    assert.equal(r.cantidadFacturas, 2);
    assert.equal(r.cantidadGastos, 2);
});

test('resumenIva: saldo negativo = remanente a favor', () => {
    const r = resumenIva([], [{ iva: 500 }]);
    assert.equal(r.saldo, -500);
});
