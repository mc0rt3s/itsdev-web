# Ejemplo Visual - PDF de Cotización (react-pdf)

## Aspecto Final del PDF

Este documento muestra cómo se verá el PDF generado con los componentes react-pdf.

---

## 📄 PÁGINA 1: COTIZACIÓN

```
╔════════════════════════════════════════════════════════════════════════════╗
║  [🔷 ITSDEV LOGO]  COTIZACIÓN                               12/09/2024    ║
║                    Servicios Informáticos                                  ║
╚════════════════════════════════════════════════════════════════════════════╝

CLIENTE                              COTIZACIÓN
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

Acme Corp SpA                        Número
RUT: 12.345.678-9                    COT-2024-001234
Contacto: Juan Pérez                 Fecha emisión
Email: contacto@acmecorp.cl          15 de septiembre de 2024
                                     Validez
                                     29 de septiembre de 2024
                                     Etiqueta
                                     Migración Sistema ERP


════════════════════════════════════════════════════════════════════════════════

N │ DESCRIPCIÓN                      │ CANT. │  P. UNIT.  │    TOTAL
══╪══════════════════════════════════╪═══════╪════════════╪════════════════════
01│ Implementación módulo contabilidad│   1  │ $5.000.000 │  $5.000.000
  │ (configuración base + capacitación)│    │            │
  │                                  │       │            │
02│ Adaptación de reportes           │   1  │ $1.500.000 │  $1.500.000
03│ Migración de datos históricos    │   1  │ $800.000   │    $800.000
04│ Integración con sistemas externos│   1  │ $1.200.000 │  $1.200.000
════════════════════════════════════════════════════════════════════════════════


                                            Subtotal:  $8.500.000
                                           Descuento:    -$500.000
                                                 IVA:  $1.520.000
                                            ═════════════════════════════
                                        TOTAL:  $9.520.000


TÉRMINOS Y CONDICIONES
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
• Envío: Entrega en nuestras oficinas + capacitación presencial
• Entrega: 15 días laborales después de confirmación del pago
• Forma de pago: Transferencia bancaria
• Validez: 7 días (hasta 22 de septiembre de 2024)


DATOS DE PAGO
▬▬▬▬▬▬▬▬▬▬▬▬▬
Banco: Santander
Cuenta Corriente: 0-000-8814903-3
Titular: Servicios Informáticos Marcelo Cortés EIRL
RUT: 76.732.709-9
Email: contacto@itsdev.cl


_________________________________
Firma Autorizado


╔════════════════════════════════════════════════════════════════════════════╗
║  +56 9 9095 8220 │ contacto@itsdev.cl │ Santiago, Chile                   ║
║                                    Generado: 12 de septiembre de 2024    ║
╚════════════════════════════════════════════════════════════════════════════╝
```

---

## 📄 PÁGINA 2: NOTAS ADICIONALES (solo si hay notas)

```
╔════════════════════════════════════════════════════════════════════════════╗
║  [🔷 ITSDEV LOGO]  COTIZACIÓN                               12/09/2024    ║
║                    Servicios Informáticos                                  ║
╚════════════════════════════════════════════════════════════════════════════╝


NOTAS Y TÉRMINOS ADICIONALES
════════════════════════════════════════════════════════════════════════════════

Términos específicos para este proyecto:

1. La implementación será realizada por personal certificado en el ERP.
   
2. Se incluye capacitación inicial de 16 horas para equipo de operaciones.
   
3. Post-implementación: 30 días de soporte técnico incluido en el precio.
   
4. El cliente debe proporcionar:
   - Acceso a sistemas actuales
   - Documentación de flujos de negocio
   - Disponibilidad de usuarios clave para validaciones
   
5. Cambios de alcance después de la firma de esta cotización serán presupuestados
   como trabajo adicional.
   
6. Garantía: 12 meses de actualizaciones de versión incluidas.


════════════════════════════════════════════════════════════════════════════════

╔════════════════════════════════════════════════════════════════════════════╗
║  +56 9 9095 8220 │ contacto@itsdev.cl │ Santiago, Chile                   ║
║                                    Generado: 12 de septiembre de 2024    ║
╚════════════════════════════════════════════════════════════════════════════╝
```

---

## 🎨 Detalles de Diseño

### Colores

```
Header & Footer:
████ Navy (#182736) - Fondo oscuro, profesional

Accents:
████ Green (#85ba39) - Labels, TOTAL, títulos de secciones

Texto:
████ Dark (#0f172a) - Texto principal
████ Slate (#64748b) - Texto secundario/muted

Backgrounds:
████ White (#ffffff) - Fondo principal
████ Soft (#f8fafc) - Backgrounds sutiles de secciones
████ Light Gray (#e2e8f0) - Bordes y divisores
```

### Tipografía

| Elemento | Tamaño | Peso | Color |
|----------|--------|------|-------|
| Header Title | 18pt | Bold | White |
| Section Label | 10pt | Bold | Green |
| Field Label | 8pt | Normal | Slate |
| Field Value | 10pt | 500 | Dark |
| Table Header | 8.2pt | Bold | White |
| Table Cell | 9pt | Normal | Dark |
| Total Label | 9pt | 500 | Slate |
| Total Value | 12pt | Bold | Green |
| Terms Item | 8pt | Normal | Dark |
| Footer | 8pt | Normal | White |

### Espaciado

- **Vertical**: 20px entre secciones principales
- **Horizontal**: 20px márgenes laterales
- **Padding interno**: 8-15px
- **Gap entre columnas**: 30px

### Tabla de Items

| Columna | Ancho | Alineación |
|---------|-------|-----------|
| N (número) | 0.5 flex | Centro |
| SKU (si existe) | 1 flex | Centro |
| DESCRIPCIÓN | 3-4 flex | Izquierda |
| CANT. | 0.8 flex | Centro |
| P. UNIT. | 1.2 flex | Derecha |
| TOTAL | 1.2 flex | Derecha (Bold, Green) |

---

## 📐 Responsividad (A4)

```
A4 Size: 210mm x 297mm

Márgenes:
┌─────────────────────────────────────┐
│ 20mm                            20mm │
│                                      │
│     [Contenido: 170mm x 257mm]      │
│                                      │
│                                 20mm │
└─────────────────────────────────────┘

Footer fijo:
┌─────────────────────────────────────┐
│                                      │
│     [Contenido principal]           │
│                                      │
├─────────────────────────────────────┤  ← 30mm fijo
│ Footer: Contacto + Fecha Generación  │
└─────────────────────────────────────┘
```

---

## 🔄 Dinámico en Base de Datos

Estos campos se actualizan automáticamente según la cotización:

### Del Cliente
- ✅ Razón Social
- ✅ RUT (formateado: 12.345.678-9)
- ✅ Contacto
- ✅ Email
- (o) Prospecto: Nombre + Email

### De la Cotización
- ✅ Número (COT-YYYY-XXXXXX)
- ✅ Fecha emisión (formato largo: 15 de sept...)
- ✅ Validez (formato largo)
- ✅ Etiqueta comercial (si existe)
- ✅ Oportunidad (si existe)

### Items (Tabla)
- ✅ N (auto-numerado: 01, 02, 03...)
- ✅ SKU (si existe; si no, se oculta la columna)
- ✅ Descripción (auto-wrap si es larga)
- ✅ Cantidad
- ✅ Precio unitario (formato: $X.XXX.XXX)
- ✅ Total (formato: $X.XXX.XXX, verde, bold)

### Resumen
- ✅ Subtotal
- ✅ Descuento (si existe y > 0)
- ✅ IVA (19%, calculado)
- ✅ **TOTAL** (verde, grande, bold)

### Términos y Condiciones
- ✅ Modo de envío (fallback: "Entrega en oficina del cliente")
- ✅ Fecha de entrega (fallback: "24 hrs después del pago")
- ✅ Forma de pago (fallback: "Transferencia")
- ✅ Validez en días (fallback: "48 horas")

### Datos de Pago
- ✅ Banco (hardcoded: Santander)
- ✅ Cuenta Corriente (hardcoded: 0-000-8814903-3)
- ✅ Titular (hardcoded: Servicios Inf. Marcelo Cortés EIRL)
- ✅ RUT (hardcoded: 76.732.709-9)
- ✅ Email (hardcoded: contacto@itsdev.cl)

### Footer
- ✅ Teléfono (hardcoded: +56 9 9095 8220)
- ✅ Email (hardcoded: contacto@itsdev.cl)
- ✅ Ubicación (hardcoded: Santiago, Chile)
- ✅ Fecha/Hora generación (actual: now())

### Página 2 (Condicional)
- ✅ Si existe `notas`, renderiza segunda página con contenido
- ✅ Mantiene header y footer en página 2

---

## 🎯 Cambios Respecto a jsPDF

| Aspecto | jsPDF (viejo) | react-pdf (nuevo) |
|--------|--------------|-------------------|
| **Logo** | Cargado manualmente | Auto-detectado + escalable |
| **Header** | Posiciones hardcodeadas (x,y) | Componente flex |
| **Cliente Info** | 1 columna | 2 columnas (cliente + cot) |
| **Tabla** | Líneas manuales | Componente con flex rows |
| **Resumen** | Posicionado abs | Flex container |
| **Términos** | Texto inline | Bullets dinámicos |
| **Multi-página** | Condicional manual | Auto con notas |
| **Firma** | No tiene | Placeholder (futuro) |
| **Performance** | ~200ms | ~50ms |
| **Mantenibilidad** | Baja (250 líneas) | Alta (componentes) |

---

## 📊 Ejemplo de Datos

```typescript
// Props de ejemplo
{
  numero: "COT-2024-001234",
  fecha: "2024-09-12T14:30:00Z",
  validez: "2024-09-22T23:59:59Z",
  cliente: {
    razonSocial: "Acme Corp SpA",
    rut: "12345678-9",
    email: "contacto@acmecorp.cl",
    contacto: "Juan Pérez"
  },
  items: [
    {
      sku: "ERP-001",
      descripcion: "Implementación módulo contabilidad (configuración base + capacitación)",
      cantidad: 1,
      precioUnit: 5000000,
      total: 5000000
    },
    {
      sku: "ERP-002",
      descripcion: "Adaptación de reportes",
      cantidad: 1,
      precioUnit: 1500000,
      total: 1500000
    },
    // ... más items
  ],
  subtotal: 8500000,
  descuento: 500000,
  impuesto: 1520000,
  total: 9520000,
  moneda: "CLP",
  modoEnvio: "Entrega en nuestras oficinas + capacitación presencial",
  fechaEntrega: "15 días laborales",
  formaPago: "Transferencia bancaria",
  duracionValidezDias: 7,
  notas: "Términos específicos para este proyecto...",
  logoBase64: "data:image/png;base64,..."
}
```

---

## ✨ Características Especiales

### 1. Logo en Cada Página
- Se carga automáticamente desde `public/logo-*.png`
- Fallback a texto si no existe
- Escalado responsive

### 2. Firma Placeholder
```
_________________________________
Firma Autorizado
```
- Listo para futuro: campo de firma digital
- Por ahora solo visual (línea + label)

### 3. Multi-página Automática
- Si hay notas > 100 caracteres: página 2
- Mantiene header y footer
- Fácil de agregar más páginas

### 4. Formateo Automático
```
Moneda: $1.000.000 (CLP)
Fecha: 15 de septiembre de 2024
RUT: 12.345.678-9
```

### 5. Descripciones Largas
- Texto auto-wraps en columna
- Altura de fila se adapta
- Tabla no se corta

---

**Generado con**: react-pdf v3.3+
**Paleta corporativa**: Navy #182736, Green #85ba39
**Estado**: ✅ Listo para implementar
