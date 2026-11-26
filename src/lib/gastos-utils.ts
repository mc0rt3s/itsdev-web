// Reglas de gasto: el IVA solo es crédito fiscal con factura; el monto CLP sale del original si es moneda extranjera.

export interface GastoEntrada {
  monto: number;
  iva?: number | null;
  moneda: 'CLP' | 'USD' | 'UF';
  montoOriginal?: number | null;
  tipoCambio?: number | null;
  tipoDocumento: 'factura' | 'boleta' | 'silvestre' | 'suscripcion' | 'otro';
}

export interface GastoNormalizado {
  monto: number;
  iva: number;
  montoOriginal: number | null;
  tipoCambio: number | null;
}

export function normalizarGasto(g: GastoEntrada): { ok: true; data: GastoNormalizado } | { ok: false; error: string } {
  // Monto en CLP: si es moneda extranjera, exige monto original y tipo de cambio.
  if (g.moneda === 'CLP') {
    return {
      ok: true,
      data: {
        monto: g.monto,
        iva: g.tipoDocumento === 'factura' ? (g.iva ?? 0) : 0,
        montoOriginal: null,
        tipoCambio: null,
      },
    };
  }

  if (!g.montoOriginal || !g.tipoCambio) {
    return { ok: false, error: `Para ${g.moneda} indica monto original y tipo de cambio` };
  }

  return {
    ok: true,
    data: {
      monto: Math.round(g.montoOriginal * g.tipoCambio),
      iva: g.tipoDocumento === 'factura' ? (g.iva ?? 0) : 0,
      montoOriginal: g.montoOriginal,
      tipoCambio: g.tipoCambio,
    },
  };
}
