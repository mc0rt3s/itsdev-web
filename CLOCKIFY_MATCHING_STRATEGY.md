# Estrategia de Matching: Clientes itsdev-web ↔ Clockify

## PROBLEMA

Clockify tiene clientes históricos creados **años atrás**.  
itsdev-web es nuevo y sus clientes se crean manualmente.  
No hay vinculación automática → `clockifyClientId` queda NULL.

**Sin matching:** Portal cliente NO ve atenciones (Clockify está vacío para ese cliente).

---

## 1. ESTRUCTURA DE DATOS

### itsdev-web (Prisma)

```prisma
model Cliente {
  id                String   @id @default(cuid())
  rut               String   @unique          ← Identificador chileno único
  razonSocial       String   
  contacto          String?
  telefono          String?
  email             String?
  notas             String?
  estado            String   @default("activo")
  clockifyClientId  String?  ← Campo para vincular (actualmente NULL)
  facturaPorTiempo  Boolean  @default(false)
  proyectos         Proyecto[]
  accesos           Acceso[]
  // ... más
}
```

### Clockify (API REST)

```json
GET /api/v1/workspaces/{workspaceId}/clients
→ [{
  "id": "abc123...",        // UUID Clockify
  "name": "Empresa S.A.",   // Nombre del cliente
  "note": "...",            // Notas libres
  "currencyId": "CLP",
  "hourlyRate": 0,
  "memberships": [...]      // Acceso a qué proyectos
}]
```

**Problema:** Clockify NO guarda RUT chileno. Solo `name` (nombre libre).

---

## 2. ESTRATEGIA DE MATCHING

### Opción A: Matching exacto por nombre (RISKY)

**Lógica:**
```
Para cada Cliente en itsdev-web:
  Buscar en Clockify: cliente.name == cliente.razonSocial (case-insensitive)
  Si match exacto → guardar clockifyClientId
  Si no → marcar manual review
```

**Pros:**
- Simple, rápido
- No requiere cambios en Clockify

**Contras:**
- Nombres pueden no coincidir (variaciones: "SA", "LTDA", mayúsculas, etc.)
- False negatives alto (p.ej. "Tech Company" vs "Tech Company Chile")
- False positives posibles (empresas con nombre similar)

**Recomendación:** ❌ No solo, pero útil como primer pass

---

### Opción B: Matching automático + UI manual (RECOMENDADO)

**Fase 1: Algoritmo inteligente**

1. **Search by name similarity** (fuzzy match, Levenshtein distance)
   - Buscar en Clockify top 5 clientes más parecidos
   - Score > 80% de similitud → candidatos válidos

2. **Normalizar nombres**
   - Remover: "SA", "LTDA", "S.A.", "Ltda.", etc.
   - Lowercase + trim
   - Comparar tokens principales

3. **Search by email** (si disponible)
   - Si Cliente tiene email → buscar en Clockify.note si contiene ese email
   - Menos confiable pero descarta false positives

**Pseudocódigo:**
```typescript
async function findClockifyMatches(cliente: Cliente): Promise<ClockifyClient[]> {
  const apiKey = process.env.CLOCKIFY_API_KEY;
  const workspaceId = process.env.CLOCKIFY_WORKSPACE_ID;
  
  // 1. Fetch all Clockify clients
  const clockifyClients = await fetch(
    `/v1/workspaces/${workspaceId}/clients`, 
    { headers: { 'X-Api-Key': apiKey } }
  ).then(r => r.json());
  
  // 2. Normalize and score
  const normalized = normalizeClientName(cliente.razonSocial);
  const candidates = clockifyClients
    .map(cc => ({
      ...cc,
      score: levenshteinSimilarity(normalized, normalizeClientName(cc.name))
    }))
    .filter(cc => cc.score > 0.75)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  
  return candidates;
}
```

**Fase 2: UI para asignación manual**

En `src/app/admin/clientes/[id]/page.tsx`:

```
┌─────────────────────────────────────────┐
│ Vinculación Clockify                    │
├─────────────────────────────────────────┤
│ Cliente: TECH COMPANY LTDA              │
│ Clockify ID: [vacío]                    │
│                                         │
│ 🔍 Buscar clientes en Clockify          │
│ ┌─────────────────────────────────────┐ │
│ │ ☑ Tech Company (similitud: 95%)    │ │
│ │ ○ TechCom S.A. (similitud: 82%)    │ │
│ │ ○ Techno Solutions (similitud: 68%)│ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Seleccionar]  [No hay match]  [Crear] │
└─────────────────────────────────────────┘
```

**Versión mejorada:** Checkbox para match correcto + guardar.

---

### Opción C: Bulk matching on create (UX IDEAL)

**En `/admin/clientes/crear`:**

1. Usuario ingresa datos del cliente (RUT, razón social, email)
2. Sistema automáticamente busca matches en Clockify
3. Muestra top 3 candidatos con score
4. Usuario elige:
   - ☑ "Usar este cliente de Clockify" → vincula
   - ○ "Crear nuevo en Clockify"
   - ○ "Asociar después"
5. Guardar Cliente + clockifyClientId

**Pseudocódigo de form:**

```tsx
export default function CrearClientePage() {
  const [razonSocial, setRazonSocial] = useState('');
  const [clockifyCandidates, setClockifyCandidates] = useState([]);
  const [selectedClockifyId, setSelectedClockifyId] = useState('');
  
  const handleRazonSocialChange = async (e) => {
    const value = e.target.value;
    setRazonSocial(value);
    
    if (value.length > 2) {
      // Buscar en Clockify en tiempo real
      const res = await fetch(
        `/api/clientes/search-clockify?q=${encodeURIComponent(value)}`
      );
      const candidates = await res.json();
      setClockifyCandidates(candidates);
    }
  };
  
  const handleCreate = async (e) => {
    e.preventDefault();
    
    // Crear cliente + vincular Clockify si se seleccionó
    await fetch('/api/clientes', {
      method: 'POST',
      body: JSON.stringify({
        rut: rut,
        razonSocial: razonSocial,
        clockifyClientId: selectedClockifyId || undefined,
        // ...
      })
    });
  };
  
  return (
    <form>
      <input 
        value={razonSocial} 
        onChange={handleRazonSocialChange}
        placeholder="Ej: Tech Company LTDA"
      />
      
      {clockifyCandidates.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium">Clientes similares en Clockify:</p>
          {clockifyCandidates.map(cc => (
            <label key={cc.id} className="block mt-2">
              <input
                type="radio"
                name="clockify"
                value={cc.id}
                onChange={(e) => setSelectedClockifyId(e.target.value)}
              />
              <span className="ml-2">
                {cc.name} 
                <span className="text-xs text-slate-400"> ({cc.score.toFixed(0)}%)</span>
              </span>
            </label>
          ))}
          <label className="block mt-2">
            <input type="radio" name="clockify" value="" onChange={() => setSelectedClockifyId('')} />
            <span className="ml-2">No hay coincidencia / Crear después</span>
          </label>
        </div>
      )}
      
      <button type="submit">Crear Cliente</button>
    </form>
  );
}
```

---

### Opción D: Bulk sync (Para clientes existentes)

**Problema:** Ya hay clientes en itsdev-web SIN vincular.

**Solución:** Admin > Página batch matching

```
┌──────────────────────────────────────────┐
│ Sincronización Clockify - Bulk Matching  │
├──────────────────────────────────────────┤
│ ✓ Cargar clientes desde Clockify         │
│ ✓ Detectar matches automáticos           │
│ ✓ Mostrar tabla de candidatos            │
│                                          │
│ Clientes sin vincular: 12                │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ itsdev-web      │ Match Clockify   │  │
│ │─────────────────────────────────────│  │
│ │ Tech Co. LTDA   │ ☑ Tech Company   │  │
│ │ Soft Inc.       │ ○ Soft Inc SA    │  │
│ │ Web Experts     │ ✗ Sin match      │  │
│ └────────────────────────────────────┘  │
│                                          │
│ [Sincronizar seleccionados] [Cancelar]   │
└──────────────────────────────────────────┘
```

---

## 3. IMPLEMENTACIÓN PROPUESTA

### MVP (Fase 1): Matching manual en cliente details

1. **Helper:** `findClockifyMatches(razonSocial, email) → ClockifyClient[]`
   - Fuzzy matching por nombre
   - Opcional: búsqueda por email en notas
   - Return top 5 candidatos con score

2. **API:** `GET /api/clientes/search-clockify?q=...`
   - Query parámetro: `q` (razón social o email)
   - Retorna: `[{ id, name, note, score }]`

3. **UI en cliente details:**
   - Agregar sección "Vinculación Clockify"
   - Mostrar: clockifyClientId actual o "No vinculado"
   - Botón: "Buscar en Clockify"
   - Lista de candidatos con radio buttons
   - Guardar selección

**Time: 3-4 horas**

### Phase 2: Matching on create (Mejora UX)

1. Integrar búsqueda en form crear cliente
2. Real-time matching mientras escriben razón social
3. Seleccionar antes de guardar

**Time: 2-3 horas**

### Phase 3: Bulk sync (Admin utility)

1. Página `/admin/integraciones/clockify-sync`
2. Cargar todos los clientes Clockify
3. Detectar matches automáticos
4. UI para revisar y confirmar
5. Batch update

**Time: 4-5 horas**

---

## 4. ALGORITMO DE SIMILITUD (Pseudocódigo)

```typescript
function normalizeClientName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(sa|ltda|sac|spa|eirl|s\.a\.|ltda\.|sac\.|spa\.|eirl\.)\b/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 2)
    .join(' ');
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function levenshteinSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(a, b);
  return 1 - distance / maxLen;
}
```

---

## 5. DECISIONES & TRADE-OFFS

| Decisión | Por qué | Trade-off |
|----------|---------|-----------|
| No usar RUT para matching | Clockify no guarda RUT | Menor confianza, false positives |
| Fuzzy matching + manual review | Balance: automatización + seguridad | Pequeño esfuerzo admin |
| MVP = matching en details, después create | Menos trabajo inicial | Clientes nuevos tendrán que vincular después |
| Score threshold 75% | Evita matches malos | Algunos buenos quedan sin candidatos |
| Top 5 resultados | Balance: opciones vs simplicidad | Usuario elige manualmente |

---

## 6. PLAN DE TRABAJO (RECOMENDADO)

### Fase 1: MVP Matching Manual (3-4h) ✓ EMPEZAR AQUÍ

- [ ] Helper: `findClockifyMatches()`
- [ ] API: `GET /api/clientes/search-clockify`
- [ ] UI: Sección en cliente details (select + guardar)
- [ ] Test: Manual verification

### Fase 2: Matching on Create (2-3h)

- [ ] Integrar búsqueda en form crear
- [ ] Real-time candidates
- [ ] Seleccionar antes de guardar

### Fase 3: Bulk Sync Admin (4-5h)

- [ ] Página `/admin/integraciones/clockify-sync`
- [ ] Batch operations
- [ ] Logs de sincronización

### Fase 4: Migration (clientes históricos)

- [ ] Ejecutar bulk sync una sola vez
- [ ] Manual review para matches con score < 80%
- [ ] Guardar resultados

---

## 7. DATOS EJEMPLARES

**itsdev-web:**
```
- RUT: 12.345.678-9
- razonSocial: "Tech Company LTDA"
- email: contact@techco.cl
```

**Clockify:**
```
- id: "61a2b3c4d5e6f7g8h9i0"
- name: "Tech Company"
- note: "Cliente empresa tecnológica, contact@techco.cl"
```

**Match esperado:** Similitud 95% → Vinculación segura

---

## 8. NEXT STEPS

1. **Implementar Fase 1 (MVP)**
   - Helper de fuzzy matching
   - API search
   - UI en cliente details

2. **Test con datos reales**
   - Verificar matches contra Clockify actual
   - Ajustar threshold si es necesario

3. **Hacer Fase 2 (create form)**
   - UX mejorada para nuevos clientes

4. **Ejecutar Fase 3 (bulk sync)**
   - Una sola vez, sincronizar histórico

5. **Documentar para usuarios**
   - Cómo vincular clientes
   - Qué pasa cuando no hay match
