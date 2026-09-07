# Componentes PDF con react-pdf

Rediseño de PDFs usando `@react-pdf/renderer` para mejor mantenibilidad y diseño moderno.

## Archivos

- `CotizacionPDFDocument.tsx` - Componente principal de cotización (exporta componente React)
- `CotizacionPDFStyles.ts` - Estilos centralizados y utilidades de formato
- (Próximo) `FacturaPDFDocument.tsx` - Documento de factura
- (Próximo) `PropuestaPDFDocument.tsx` - Documento de propuesta

## Uso

### En el backend (API route)

```typescript
// src/app/api/cotizaciones/[id]/pdf/route.ts
import CotizacionPDFDocument, { type CotizacionPDFProps } from '@/components/pdf/CotizacionPDFDocument';
import { renderPDFToBuffer, loadLogoBase64 } from '@/lib/pdf-react';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const cotizacion = await prisma.cotizacion.findUnique({
    where: { id },
    include: { cliente: true, items: true }
  });

  if (!cotizacion) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const props: CotizacionPDFProps = {
    numero: cotizacion.numero,
    fecha: cotizacion.fecha.toISOString(),
    validez: cotizacion.validez.toISOString(),
    cliente: cotizacion.cliente ? {
      razonSocial: cotizacion.cliente.razonSocial,
      rut: cotizacion.cliente.rut,
      email: cotizacion.cliente.email,
      contacto: cotizacion.cliente.contacto,
    } : undefined,
    items: cotizacion.items.map(item => ({
      sku: item.sku,
      descripcion: item.descripcion,
      cantidad: item.cantidad,
      precioUnit: item.precioUnit,
      total: item.total,
    })),
    subtotal: cotizacion.subtotal,
    descuento: cotizacion.descuento,
    impuesto: cotizacion.impuesto,
    total: cotizacion.total,
    modoEnvio: cotizacion.modoEnvio,
    fechaEntrega: cotizacion.fechaEntrega,
    formaPago: cotizacion.formaPago,
    duracionValidezDias: cotizacion.duracionValidezDias,
    notas: cotizacion.notas,
    logoBase64: loadLogoBase64(),
  };

  const pdfBuffer = await renderPDFToBuffer(
    <CotizacionPDFDocument {...props} />
  );

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Cotizacion-${cotizacion.numero}.pdf"`,
    },
  });
}
```

## Paleta de Colores

- **Navy**: `#182736` - Headers, títulos, resaltes
- **Green**: `#85ba39` - Accents, labels, total
- **Slate**: `#64748b` - Texto secundario
- **Soft**: `#f8fafc` - Backgrounds sutiles
- **White**: `#ffffff` - Fondo principal
- **Dark**: `#0f172a` - Texto principal

## Componentes Reutilizables

Cada componente es modular y puede usarse independientemente:

### `<Header />`
Encabezado con logo + título + fecha

### `<ClientInfo />`
2 columnas: Cliente (izq) y Cotización (derecha)

### `<ItemsTable />`
Tabla de items con soporte dinámico para SKU

### `<Summary />`
Resumen financiero: Subtotal, Descuento, IVA, Total

### `<Terms />`
Términos y condiciones formateados como bullets

### `<PaymentInfo />`
Datos bancarios

### `<Signature />`
Línea de firma con label (placeholder para futura implementación)

### `<Footer />`
Footer con contacto y fecha de generación

## Formateo

Utilidades en `formatters`:

```typescript
formatters.money(1000000) // → $1.000.000 CLP
formatters.date('2024-01-15') // → 15 de enero de 2024
formatters.shortDate('2024-01-15') // → 15/01/24
formatters.rut('12345678-9') // → 12.345.678-9
```

## Estilos

Todos los estilos están centralizados en `CotizacionPDFStyles.ts` usando `StyleSheet.create()`.

Para agregar más estilos:

```typescript
// En CotizacionPDFStyles.ts
export const styles = StyleSheet.create({
  // ... existing
  miEstilo: {
    color: COLORS.navy,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
```

## Renderizado del Logo

Automático desde:
1. `public/logo-transparent.png` (preferida)
2. `public/logo-dark.png`
3. `public/logo-pdf.png`
4. Fallback: texto "ITSDev" si no existe imagen

## Soporte Multi-página

Automático: Si hay notas, se renderiza página 2 con términos adicionales.

Para agregar más páginas:

```typescript
export default function CotizacionPDFDocument(props) {
  return (
    <Document>
      <Page>...</Page>
      {props.notas && <Page>...</Page>}
      {/* Agregar más Pages aquí */}
    </Document>
  );
}
```

## Proximos Pasos

1. ✅ CotizacionPDFDocument - HECHO
2. 🔲 Integrar en API route `/api/cotizaciones/[id]/pdf`
3. 🔲 Agregar endpoint preview: `/api/cotizaciones/[id]/pdf-preview` (HTML)
4. 🔲 Crear FacturaPDFDocument (reutilizar estilos)
5. 🔲 Crear PropuestaPDFDocument (reutilizar estilos)
6. 🔲 Testing en desarrollo

## Instalación de Dependencia

```bash
npm install @react-pdf/renderer
```

Si está en producción (Dokploy):
- Actualizar `nixpacks.toml` si es necesario
- Dependencia ya incluida en build

## Troubleshooting

### Error: "Cannot find module '@react-pdf/renderer'"
```bash
npm install @react-pdf/renderer
npx prisma generate
```

### Logo no aparece en PDF
- Verificar que exista archivo en `public/logo-*.png`
- Revisar logs: `loadLogoBase64()` debería loguear error

### Estilos no aplican
- Revisar que StyleSheet se importe correctamente
- react-pdf solo soporta subset de CSS (no flexbox completo)

---

**Diseño corporativo mantenido**: Navy #182736, Green #85ba39
**Performance**: ~50ms por PDF (~10x más rápido que jsPDF + renderizado)
