export interface FacturaIva {
    impuesto: number;
}

export interface GastoIva {
    iva: number | null;
}

/**
 * Rango [desde, hasta) en UTC que cubre el mes calendario en America/Santiago.
 * Calcula el offset real con Intl (cambia con horario de verano), no hardcodeado.
 */
export function rangoMesChile(anio: number, mes: number): { desde: Date; hasta: Date } {
    const inicioUtc = (y: number, m: number) => {
        // Medianoche local Chile = medianoche UTC + offset. Probamos offset con Intl.
        const naive = Date.UTC(y, m - 1, 1);
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Santiago',
            hour12: false,
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
        }).formatToParts(new Date(naive));
        const get = (t: string) => Number(parts.find(p => p.type === t)?.value);
        const localAsUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'));
        const offset = localAsUtc - naive; // ms que Chile está respecto de UTC
        return new Date(naive - offset);
    };
    const siguiente = mes === 12 ? { y: anio + 1, m: 1 } : { y: anio, m: mes + 1 };
    return { desde: inicioUtc(anio, mes), hasta: inicioUtc(siguiente.y, siguiente.m) };
}

/**
 * Resumen F29 simple. Débito = IVA de facturas emitidas; crédito = IVA de gastos.
 * Saldo > 0 = pagar al SII; saldo < 0 = remanente a favor.
 */
export function resumenIva(facturas: FacturaIva[], gastos: GastoIva[]) {
    const redondear = (n: number) => Math.round(n);
    const debito = redondear(facturas.reduce((s, f) => s + (f.impuesto || 0), 0));
    const credito = redondear(gastos.reduce((s, g) => s + (g.iva || 0), 0));
    return {
        debito,
        credito,
        saldo: debito - credito,
        cantidadFacturas: facturas.length,
        cantidadGastos: gastos.length,
    };
}
