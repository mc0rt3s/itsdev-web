# Rediseño PDF de Cotización

## Estado Actual

**Archivo**: `src/lib/pdf-generator.ts`
- Función: `generateCotizacionPDF()` (línea 329)
- Librería: **jsPDF** (canvas-based, bajo nivel)
- Tamaño: ~250 líneas de código

### Estructura Actual
```
[HEADER - Navy background con logo + "COTIZACIÓN"]
[CLIENTE INFO - Nombre, RUT, email, fechas]
[TABLA - Items con SKU, descripción, cant, precio, total]
[RESUMEN - Subtotal, descuento, IVA, TOTAL]
[CONDICIONES - Modo envío, forma pago, validez]
[DATOS PAGO - Banco Santander, cuenta corriente]
[FOOTER - Contacto + fecha generación]
```

### Limitaciones Actuales
- Código hardcodeado (posiciones, colores, tamaños)
- Difícil de cambiar layout sin reescribir todo
- No reutilizable (Factura y Propuesta tienen lógica similar duplicada)
- Datos bancarios hardcodeados
- Sin capas de diseño (header, content, footer no son modular)

---

## Opciones de Rediseño

### OPCIÓN 1: Mejorar jsPDF (Low Effort ⚡)
**Pro**: Rápido, mismo stack, no cambia API
**Contra**: Sigue siendo verbose y manual

```typescript
// Versión modularizada con helpers
class CotizacionPDFBuilder {
  private doc: jsPDF;
  
  drawHeader(data: HeaderData) { /* ... */ }
  drawClientInfo(data: ClientData) { /* ... */ }
  drawItemsTable(items: Item[]) { /* ... */ }
  drawSummary(totals: Totals) { /* ... */ }
  drawFooter() { /* ... */ }
  
  build(): Buffer { /* composición */ }
}
```

**Cambios Visuales Posibles**:
- Layout de 2 columnas en cliente/proyecto
- Tabla más compacta (menos padding)
- Colores dinámicos (por tipo de cotización)
- QR con link de cotización
- Firma digital placeholder
- Términos y condiciones en página 2

---

### OPCIÓN 2: HTML → PDF con Puppeteer (Medium Effort 🔧)
**Pro**: CSS moderno, diseño limpio, reutilizable
**Contra**: Dependencia new (Puppeteer), overhead de browser

```typescript
// Renderizar React component a HTML, luego a PDF
import { renderToString } from 'react-dom/server';
import CotizacionPDFTemplate from '@/components/CotizacionPDFTemplate';

export async function generateCotizacionPDF(data) {
  const html = renderToString(<CotizacionPDFTemplate {...data} />);
  const pdf = await renderPDF(html); // Puppeteer
  return pdf;
}
```

**Setup**:
```json
{
  "dependencies": {
    "puppeteer": "^22.0.0"
  }
}
```

**Ventajas**:
- Diseño con Tailwind/CSS puro
- Fácil de mantener
- Soporta gradients, imágenes, fonts
- Versión HTML para preview antes de download

**Cambios Visuales Posibles**:
- Diseño moderno (card-based)
- Responsivo-looking en tamaño A4
- Animaciones estáticas en PDF (solo visual)
- Temas (blanco/oscuro)
- Logo escalable sin pérdida
- Fondos con patrón/textura

---

### OPCIÓN 3: React + react-pdf (High Effort 🚀)
**Pro**: Full React ecosystem, type-safe
**Contra**: Curva de aprendizaje, overhead de build

```typescript
import { Document, Page, Text, View, Image } from '@react-pdf/renderer';
import styles from './CotizacionPDF.styles';

const CotizacionPDFDocument = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Header data={data} />
      <ClientInfo data={data} />
      <ItemsTable items={data.items} />
      <Summary totals={data} />
      <Footer />
    </Page>
  </Document>
);
```

**Setup**:
```json
{
  "dependencies": {
    "@react-pdf/renderer": "^3.3.12"
  }
}
```

**Ventajas**:
- Type-safe (TypeScript full support)
- Componentes reutilizables
- Themes/tokens centralizados
- Fácil testing
- Sin dependencies pesadas (no browser)

**Cambios Visuales Posibles**:
- Mismo que Puppeteer
- + Animaciones suaves en transiciones
- + Gradientes nativos
- + Mejor rendimiento que Puppeteer

---

## Diseño Propuesto (Cualquier Opción)

### Paleta de Colores
```
Primary (Actual): Navy #182736
Accent: Green #85ba39
Neutral: Slate #64748b
Background: Soft #f8fafc
White: #ffffff
```

### Layout Nuevo

```
┌─────────────────────────────────┐
│ [LOGO]  ITSDEV - COTIZACIÓN  [DATE]
├─────────────────────────────────┤
│                                 │
│  PARA:                PROYECTO: │
│  ▎ Cliente Name      ▎ Proyect  │
│  ▎ RUT               ▎ Opport.  │
│  ▎ Contacto          ▎ Fecha    │
│  ▎ Email             ▎ Validez  │
│                                 │
├─────────────────────────────────┤
│ N | DESCRIPCIÓN | CANT | PRECIO│
├─────────────────────────────────┤
│ 01| Servicio A   |   1  | $1000 │
│ 02| Servicio B   |   2  | $2000 │
├─────────────────────────────────┤
│                    Subtotal: ... │
│                  Descuento: ... │
│                       IVA: ... │
│ ════════════════════════════════│
│                       TOTAL: XXX │
├─────────────────────────────────┤
│                                 │
│ TÉRMINOS Y CONDICIONES:         │
│ • Envío: ...                    │
│ • Validez: 48 horas             │
│ • Pago: Transferencia           │
│                                 │
│ DATOS DE PAGO:                  │
│ Banco: Santander                │
│ Cuenta: 0-000-8814903-3         │
│ Titular: Servicios Inf. ...     │
│                                 │
├─────────────────────────────────┤
│ www.itsdev.cl | +56 9 9095 8220 │
│ contacto@itsdev.cl              │
└─────────────────────────────────┘
```

### Cambios Principales
1. **Header Limpio**: Menos alto, más minimalista
2. **2 Columnas en Info**: Cliente a la izq, proyecto a la derecha
3. **Tabla Mejorada**: Líneas más sutiles, mejor spacing
4. **Resumen Destacado**: Verde en TOTAL (énfasis)
5. **Términos Bullet Points**: Más legible
6. **Footer Integrado**: Sin fondo navy innecesario

### Página 2 (Nota Largos)
Si hay notas > 200 caracteres:
```
┌─────────────────────────────────┐
│ [Notas] - Términos Adicionales  │
│ ────────────────────────────────│
│ <contenido de notas formateado> │
│                                 │
│ Términos y condiciones aplicadas│
│ Vigencia de la cotización...    │
└─────────────────────────────────┘
```

---

## Recomendación: OPCIÓN 2 (Puppeteer + HTML)

**Por qué:**
- ✅ Rápido de implementar (mismo day)
- ✅ Diseño moderno con CSS
- ✅ Preview HTML en UI antes de PDF
- ✅ Fácil de iterar
- ✅ No agrega mucho overhead (Puppeteer ~200MB)
- ✅ Compatible con staging/prod via Docker

**Tiempo estimado**: 3-4 horas
- 1h: Setup Puppeteer + helper
- 1.5h: React component HTML template
- 1h: CSS styling + testing
- 0.5h: Refactor endpoint existente

---

## Implementación Paso a Paso

### Si elijes OPCIÓN 2 (Puppeteer):

1. **Instalar dependencia**
   ```bash
   npm install puppeteer
   ```

2. **Crear template React**
   ```
   src/components/pdf/CotizacionPDFTemplate.tsx
   ```

3. **Helper para renderizar**
   ```
   src/lib/pdf-puppeteer.ts
   - exportPDFFromHTML(html): Promise<Buffer>
   ```

4. **Actualizar endpoint**
   ```
   src/app/api/cotizaciones/[id]/pdf/route.ts
   - Usar nuevo generateCotizacionPDF (Puppeteer version)
   ```

5. **Agregar preview endpoint**
   ```
   src/app/api/cotizaciones/[id]/pdf-preview/route.ts
   - Devuelve HTML (para visualizar antes de descargar)
   ```

---

## ¿Qué Necesitas?

Indicar:
1. **Colores nuevos** (mantener palette o cambiar?)
2. **Layout**: ¿2 columnas cliente/proyecto? ¿Tabla igual?
3. **Contenido extra**: ¿QR? ¿Logo en cada página?
4. **Términos**: ¿Página separada o inline?
5. **Firma**: ¿Placeholder para firmar?

Responde y procedo con implementación.
