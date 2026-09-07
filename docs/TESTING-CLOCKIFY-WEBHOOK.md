# Testing Clockify Webhook en Local

Como Clockify no acepta URLs locales (localhost), tenemos varias opciones:

## Opción 1: Usar ngrok (Recomendado para Clockify real)

```bash
# Instalar ngrok
brew install ngrok

# Exponer puerto 3000
ngrok http 3000

# Copiar URL pública (ej: https://abc123.ngrok.io)
# Registrar en Clockify: https://abc123.ngrok.io/api/clockify/webhook
```

Luego completar una tarea en Clockify y verás el evento llegar automáticamente.

---

## Opción 2: Simular webhook con curl (Local, sin internet)

### Paso 1: Crear datos de prueba

Abre una terminal y crea un cliente y proyecto vinculados a Clockify:

```bash
cd /Users/marcelo/Herd/itsdev-web

# Conectar a BD SQLite
sqlite3 prisma/dev.db

# Ejecutar estos comandos SQL:
INSERT INTO Cliente (id, rut, razonSocial, clockifyClientId, facturaPorTiempo) 
VALUES ('test-client-001', '99999999-9', 'Test Client Inc', 'test-clockify-client-id', 1);

INSERT INTO Proyecto (id, clienteId, nombre, clockifyProjectId) 
VALUES ('test-proj-001', 'test-client-001', 'Test Project', 'test-clockify-project-id');

INSERT INTO ClockifyTaskTipo (id, clockifyTaskId, clockifyProjectId, nombre, tipoHora) 
VALUES ('task-tipo-001', 'test-task-id', 'test-clockify-project-id', 'Test Task', 'habil');

# Salir con Ctrl+D
```

### Paso 2: Enviar evento webhook con curl

```bash
# Test 1: Time entry de 1 hora
curl -X POST http://localhost:3000/api/clockify/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "TIME_ENTRY_UPDATED",
    "timeEntry": {
      "id": "clockify-entry-001",
      "description": "Desarrollo de login",
      "duration": 3600000,
      "start": "2024-09-02T09:00:00Z",
      "end": "2024-09-02T10:00:00Z",
      "projectId": "test-clockify-project-id",
      "taskId": "test-task-id",
      "billable": true,
      "status": "APPROVED"
    }
  }'

# Response esperado:
# {"success":true,"entryId":"<uuid>"}
```

```bash
# Test 2: Time entry de 2.5 horas
curl -X POST http://localhost:3000/api/clockify/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "TIME_ENTRY_UPDATED",
    "timeEntry": {
      "id": "clockify-entry-002",
      "description": "API de usuarios",
      "duration": 9000000,
      "start": "2024-09-02T14:00:00Z",
      "end": "2024-09-02T16:30:00Z",
      "projectId": "test-clockify-project-id",
      "taskId": "test-task-id-2",
      "billable": true,
      "status": "APPROVED"
    }
  }'
```

```bash
# Test 3: Proyecto no vinculado (error esperado)
curl -X POST http://localhost:3000/api/clockify/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "TIME_ENTRY_UPDATED",
    "timeEntry": {
      "id": "clockify-entry-003",
      "description": "Task en proyecto desconocido",
      "duration": 3600000,
      "start": "2024-09-02T11:00:00Z",
      "end": "2024-09-02T12:00:00Z",
      "projectId": "unknown-proj-id",
      "taskId": "unknown-task-id",
      "billable": true,
      "status": "APPROVED"
    }
  }'

# Response esperado:
# {"error":"Cliente no encontrado para este proyecto Clockify"}
```

### Paso 3: Verificar datos creados

```bash
sqlite3 prisma/dev.db

SELECT id, descripcion, horas, montoTotal, estado FROM FacturableEntry 
WHERE clienteId = 'test-client-001';

# Salir con Ctrl+D
```

---

## Opción 3: Script Node.js (Automatizado)

```bash
npx ts-node scripts/test-webhook.ts
```

Esto:
1. Crea datos de test automáticamente
2. Envía 4 eventos de prueba
3. Verifica que se crearon las FacturableEntries
4. Limpia la BD de test

---

## Opción 4: Testing en producción con Clockify real

Una vez lista la URL pública (ej: https://itsdev.cl):

1. Ve a tu workspace Clockify → Workspace Settings → Webhooks
2. Click "Add webhook"
3. Nombre: "ItsDev Billing Sync"
4. URL: `https://itsdev.cl/api/clockify/webhook`
5. Event type: **Time Entry → Updated**
6. Trigger source: **Workspace ID** (tu workspace)
7. Crear webhook
8. Copiar el token generado → agregarlo a `.env.production` como `CLOCKIFY_WEBHOOK_SECRET`

Completa una tarea en Clockify → se sincronizará automáticamente.

---

## Estructura del evento TIME_ENTRY_UPDATED desde Clockify

```json
{
  "eventType": "TIME_ENTRY_UPDATED",
  "timeEntry": {
    "id": "6700e58a54fc2ba37b7dad45",
    "description": "Desarrollo feature X",
    "timeInterval": {
      "start": "2024-09-02T09:00:00Z",
      "end": "2024-09-02T10:00:00Z",
      "duration": "PT1H"  // ISO 8601
    },
    "billable": true,
    "isLocked": false,
    "customFields": [],
    "projectId": "65b9c8f7a1b2c3d4e5f6g7h8",
    "taskId": "65b9c8f7a1b2c3d4e5f6g7h9",
    "status": "APPROVED"
  }
}
```

**Nota**: El endpoint actual espera `duration` en millisegundos, no ISO 8601. 
Habrá que ajustar si Clockify envía ISO 8601.

---

## Troubleshooting

**Error: "Cliente no encontrado para este proyecto Clockify"**
- Verifica que el `clockifyProjectId` del Proyecto coincida con el `projectId` del evento
- Verifica que el Proyecto tenga un Cliente vinculado

**Error: "Invalid time entry data"**
- El evento debe tener `projectId` en `timeEntry`
- El `eventType` debe ser exactamente `TIME_ENTRY_UPDATED`

**No se crea FacturableEntry pero webhook responde OK**
- Revisa los logs del dev server: `tail -f /tmp/dev-server.log`
- Verifica la BD con: `sqlite3 prisma/dev.db "SELECT * FROM FacturableEntry LIMIT 5;"`
