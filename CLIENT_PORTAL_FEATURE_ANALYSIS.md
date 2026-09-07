# Cliente Portal: Análisis de Alcances & Desarrollo

## OBJETIVO
Crear un portal de acceso cliente donde puedan ver registro de atenciones desde Clockify. Plus value aunque nunca lo usen.

---

## 1. ARQUITECTURA ACTUAL DE DATOS

### Fuentes de información disponibles:

**Clockify Integration:**
- `GET /api/clockify/report/horas` — Reporta TIME ENTRIES por cliente/proyecto
- Extrae: duration, fecha, descripción, proyecto, tarea, empleado
- Agrupa por: habil/inhabil (vía `ClockifyTaskTipo` mapping)
- Requiere: `clienteId`, `workspaceId`, `start`, `end`

**Modelos Prisma relacionados:**
- `Cliente`: id, rut, razonSocial, email, clockifyClientId, proyectos[], contacto, etc.
- `Proyecto`: id, clienteId, nombre, estado, clockifyProjectId
- `Actividad`: id, clienteId, tipo (reunion|llamada|nota|etc), asunto, scheduledAt, notas, etc.
  - Funciona como histórico de interacciones/reuniones
  - Webhook cal.com → crea automáticamente
- `Comunicacion`: clienteId, tipo (email|telefono|reunion|whatsapp), fecha, duracionMin, resumen
  - Log manual de interacciones

**Facturas (secundario):**
- `Factura`: clienteId, estado, items[], monto, fecha
- Útil mostrar estado de facturaciones asociadas

---

## 2. FEATURE: PORTAL CLIENTE

### 2.1 Acceso (Autenticación)

**Opción A: Token público por cliente (más simple)**
- Generar token único por cliente (guardarlo en `Cliente` como `portalAccessToken`)
- URL: `/cliente/portal/[token]` — sin necesidad de login
- Risk: Token expuesto en URL → guardar en localStorage cliente-side
- Ventaja: Zero auth overhead, fácil compartir link
- Desventaja: Si se filtra token, cliente ve datos

**Opción B: Auth explícita por cliente (más seguro)**
- Crear tabla `ClienteUser` (usuario de cliente)
- Email + password específico para cada cliente
- NextAuth con rol `cliente`
- URL: `/cliente/portal` → login requerido
- Ventaja: Mayor control, auditoría de acceso
- Desventaja: Setup adicional (crear usuarios, reset password)

**Recomendación:** A (token) por ahora. Upgradeara B si llega a tener datos sensibles.

### 2.2 Páginas & Datos

**Dashboard (landing):**
- Resumen: nombre cliente, contacto principal, estado
- Widget: Total horas este mes, promedio por proyecto
- Links a secciones

**Atenciones / Historial:**
- Tabla: Fecha | Proyecto | Descripción | Horas | Tipo | Empleado
- Filtros: Fecha rango, Proyecto, Tipo (habil/inhabil)
- Detalle expandible: notas, duración exacta, etc.
- Fuente: Clockify report filtered by `clockifyProjectId`

**Reuniones (Actividades):**
- Timeline: fecha, asunto, empleado (si aplica), notas
- Filtro: tipo=reunion
- Fuente: `Actividad` table

**Comunicaciones:**
- Timeline: fecha, tipo, resumen, siguiente acción
- Fuente: `Comunicacion` table (si está registrada)

**Facturas (info):**
- Tabla: Número | Fecha | Monto | Estado | Link PDF
- Solo lectura (no descargar PDF ni cambiar estado)
- Fuente: `Factura` table

**Proyectos:**
- Tabla: Nombre | Estado | Avance (%) | Fecha inicio/fin
- Fuente: `Proyecto` table

### 2.3 Routes & API

**New routes needed:**

```
GET /api/clientes/[id]/portal-token         → Generar/regenerar token
PUT /api/clientes/[id]/portal-settings      → On/off, expiration

GET /api/portal/[token]/cliente              → Detalles cliente (público, sin auth)
GET /api/portal/[token]/atenciones           → Historial Clockify (público)
GET /api/portal/[token]/reuniones            → Historial Actividad tipo=reunion
GET /api/portal/[token]/comunicaciones       → Historial Comunicacion
GET /api/portal/[token]/facturas             → Lista facturas (lectura)
GET /api/portal/[token]/proyectos            → Lista proyectos (lectura)
```

**Variante de seguridad (recomendado):**
- Validar token en middleware o helper
- Extraer `clienteId` del token
- Todos los queries filtran by clienteId
- Log accesos (opcional, vía auditoría)

### 2.4 UI/UX

**Componentes nuevos:**
- `src/app/portal/[token]/layout.tsx` — Layout protegido por token
- `src/app/portal/[token]/page.tsx` — Dashboard
- `src/app/portal/[token]/atenciones/page.tsx` — Historial
- `src/app/portal/[token]/reuniones/page.tsx` — Reuniones
- `src/app/portal/[token]/comunicaciones/page.tsx` — Comunicaciones
- `src/app/portal/[token]/facturas/page.tsx` — Facturas
- `src/app/portal/[token]/proyectos/page.tsx` — Proyectos
- `src/components/portal/` — Components compartidos (ej: MetricCard, TimelineItem)

**Styling:**
- Tailwind + misma paleta que admin (slate/slate-800)
- Mobile-first, responsive
- Tabla con scroll horizontal si es ancho

**Admin UI para gestionar:**
- En `src/app/admin/clientes/[id]/` agregar toggle "Portal cliente ON/OFF"
- Mostrar token (con opción copiar / regenerar)
- Ver logs de acceso (si auditoría activada)
- Expiration date setting (ej: 1 año, nunca)

---

## 3. DATOS: FLUJO & CÁLCULOS

### Atenciones desde Clockify:

```
GET /api/portal/[token]/atenciones?start=2025-01-01&end=2025-12-31
├─ Extrae cliente ID del token
├─ Busca proyectos del cliente con clockifyProjectId set
├─ Llamada a Clockify Reports API (detailed export)
├─ Extrae entries: fecha, proyecto, task, duration, user
├─ Mapea task ID → tipoHora (habil/inhabil) vía ClockifyTaskTipo
└─ Retorna array [{
    fecha, proyecto, descripcion/task, horas, tipoHora, empleado
  }]
```

### Agregaciones (Dashboard):

```
- Horas este mes (suma duration, filtro last 30 days)
- Horas por proyecto (group by clockifyProjectId)
- Promedio diario
- Última atención (max fecha)
```

---

## 4. PROCESO DE DESARROLLO

### Fase 1: Setup & Auth (1-2h)
1. [ ] Agregar `portalAccessToken` y `portalAccessEnabled` a `Cliente` (migration)
2. [ ] Helper: `generateClientToken()`, `validateClientToken(token) -> clienteId | null`
3. [ ] Middleware: validar token en `/api/portal/[token]/*`
4. [ ] Seed: generar token para clientes existentes (dev)

### Fase 2: API Routes (2-3h)
1. [ ] `GET /api/portal/[token]/cliente` — Detalles básicos
2. [ ] `GET /api/portal/[token]/atenciones` — Clockify report (reusar lógica actual)
3. [ ] `GET /api/portal/[token]/reuniones` — Query Actividad
4. [ ] `GET /api/portal/[token]/comunicaciones` — Query Comunicacion
5. [ ] `GET /api/portal/[token]/facturas` — Query Factura (lectura)
6. [ ] `GET /api/portal/[token]/proyectos` — Query Proyecto

### Fase 3: Admin UI (1-2h)
1. [ ] Agregar sección en cliente details: "Portal Acceso"
2. [ ] Mostrar token (copiar, regenerar)
3. [ ] Toggle ON/OFF
4. [ ] Expiration date picker

### Fase 4: Portal Pages (3-4h)
1. [ ] Layout: `src/app/portal/[token]/layout.tsx`
2. [ ] Dashboard: resumen, widgets
3. [ ] Atenciones: tabla filtrable, paginación
4. [ ] Reuniones: timeline
5. [ ] Comunicaciones: timeline
6. [ ] Facturas: tabla lectura
7. [ ] Proyectos: tabla lectura

### Fase 5: Polish & Testing (2h)
1. [ ] Responsive design
2. [ ] Error handling (token inválido, cliente sin datos)
3. [ ] Loading states
4. [ ] Perfs (lazy load datos, cache si necesario)
5. [ ] Tests básicos (token validation, auth)

**Total estimate: 9-12 horas (1-2 días)**

---

## 5. RIESGOS & MITIGACIONES

| Risk | Mitigation |
|------|-----------|
| Token expuesto en URL | Usar localStorage client-side, HTTPS only |
| Cliente ve datos de otro | Validar token → clienteId en CADA query |
| Clockify API rate limit | Cache respuesta 1h, muestra "outdated" badge |
| Cliente sin proyectos Clockify | Mostrar mensaje "Sin atenciones registradas" |
| Performance (tablas grandes) | Paginación 50 rows, índices en BD |
| Datos stale en PDF (facturas) | Mostrar "última actualización" |

---

## 6. FUTURE ENHANCEMENTS

- [ ] Descargar PDF historial (período seleccionado)
- [ ] Gráficos: horas/mes (recharts)
- [ ] Notificaciones: nueva reunión agendada
- [ ] Chat cliente-empleado (integración futura)
- [ ] Auto-generar invoice PDF desde portal
- [ ] Métricas: satisfacción, NPS (si se agrega survey)
- [ ] White-label (customizar colores/logo por cliente)

---

## 7. DECISIONES ARQUITECTÓNICAS

**Por qué token en URL vs auth real:**
- Más simple: no gestionar usuarios clientes
- Mejor UX: compartir link fácil
- Upgrade path claro si necesita más seguridad

**Por qué no incluir Kimai:**
- Kimai se está removiendo (ya no en roadmap)
- Clockify es fuente única de verdad para horas

**Por qué sólo lectura:**
- Reduce superficie de ataque
- Clientes no editan datos operacionales
- Future: agregar formulario de feedback si lo piden

**Índices recomendados:**
- `Actividad (clienteId, tipo, createdAt)`
- `Comunicacion (clienteId, fecha)`
- `Factura (clienteId, estado)`

---

## 8. SUCCESS METRICS

- [ ] Cliente accede portal > 5 veces/mes (usage)
- [ ] < 500ms respuesta API atenciones (perf)
- [ ] Cero bugs relacionados con token leak (security)
- [ ] Feedback: "Útil para ver qué estamos haciendo" (value)
