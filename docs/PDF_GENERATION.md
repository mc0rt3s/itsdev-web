# Generación de PDFs - Cotizaciones y Facturas

## Estado Actual

Utilizamos **jsPDF** para generar PDFs de cotizaciones y facturas.

## Logo en PDFs

El logo se carga desde `public/logo.png` (1280x1024, 76KB) y se embebe en base64 dentro del PDF.

### Características
- ✅ Logo visible en encabezado de cotizaciones
- ✅ Fallback a texto si no se encuentra imagen
- ✅ Compatible con facturas y propuestas

### Nota sobre Tamaño
Cada PDF generado contiene el logo embebido, lo que resulta en:
- **Tamaño actual:** ~5 MB por PDF (incluye logo sin comprimir)
- **Alternativas futuras:** Optimizar a PNG de 240x192px (~10KB) reduciría a ~500KB

## Archivos Relevantes

- `src/lib/pdf-generator.ts` - Funciones `generateCotizacionPDF()` y `generatePropuestaPDF()`
- `src/lib/pdf-generator.ts` - Función `generateFacturaPDF()` para facturas
- `src/app/api/cotizaciones/[id]/pdf/route.ts` - Endpoint GET que genera el PDF
- `public/logo.png` - Logo a usar (puede optimizarse)

## Búsqueda de Logo

El código busca en este orden:
1. `public/logo-transparent.png`
2. `public/logo-dark.png`
3. `public/logo-pdf.png` (recomendado si se optimiza)
4. `public/logo.png` (actual)

## Optimización Futura

Para reducir tamaño de PDFs a ~500KB:

1. Instalar `npm install canvas` (o usar servicio de optimización)
2. Crear script para redimensionar logo a 240x192px
3. Guardar como `public/logo-pdf.png`
4. El código la usará automáticamente

```bash
# Opción: usar herramienta online o ImageMagick
convert public/logo.png -resize 240x192 public/logo-pdf.png
```

## Color Palette (Cotizaciones)

```javascript
navy: [24, 39, 58]      // #182736
green: [133, 186, 57]   // #85BA39
line: [225, 232, 240]   // #E1E8F0
text: [15, 23, 42]      // #0F172A
muted: [71, 85, 105]    // #475569
```

## Deploy

En producción (Dokploy/Nixpacks), verificar que:
- `public/` está accesible en runtime
- jsPDF y dependencias están en `package.json`
- No hay conflictos de permisos en lectura de `public/logo.png`
