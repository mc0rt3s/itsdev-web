# Integración Kimai -> CRM (itsdev-web)

Kimai (taxi.itsdev.cl) es el sistema de time tracking. Su base de clientes se
mantiene **espejada desde el CRM**: el `Cliente` de itsdev-web es la fuente única
de la verdad y se sincroniza a Kimai vía su REST API.

## Cómo funciona
- Al **crear** o **actualizar** un `Cliente` en el CRM, se llama a `syncClienteToKimai`
  (`src/lib/kimai.ts`) de forma **fail-soft**: si Kimai falla, el CRM no se rompe
  (solo se loguea el error).
- El sync es **idempotente**: usa el `id` del cliente como referencia externa
  (campo `number` del customer en Kimai) para no duplicar. El `id` de Kimai se
  guarda en `Cliente.kimaiCustomerId` (análogo a `clockifyClientId`).
- Además hay un botón manual **"Sincronizar en Kimai"** en la ficha del cliente
  (`/admin/clientes/[id]`), que golpea `POST /api/clientes/[id]/kimai-sync`.

## API / endpoints
- `POST /api/clientes/[id]/kimai-sync` -> sincroniza un cliente hacia Kimai (auth).
  Respuesta: `{ kimaiCustomerId, action }` con action en
  `created | updated | linked | skipped`.

## Var de entorno
- `KIMAI_URL` = `https://taxi.itsdev.cl`
- `KIMAI_API_TOKEN` = token de la API de Kimai.
  Cómo generarlo: login Kimai -> clic en el avatar -> **API tokens** -> crear
  (nombre sugerido: `itsdev-web`).

## Notas de la API de Kimai (verificadas en el deploy real)
- Base: `{KIMAI_URL}/api`
- Auth: header `Authorization: Bearer <token>` (No acepta user/password ni
  `X-AUTH-USER`/`X-AUTH-TOKEN` con estas versiones).
- El campo de email al escribir es **`email`** (no `mail`); la respuesta también
  usa `email`. Enviar `mail` da 400 "extra fields".
- El filtro `?number=` NO filtra en este deploy (devuelve todos); el módulo hace
  el match client-side sobre la página. Se evita duplicar porque `kimaiCustomerId`
  queda persistido tras el primer sync.
- Campos aceptados (create/patch): `name`, `company`, `number`, `email`, `mobile`,
  `phone`, `contact`, `timezone`, `currency`, `country`, `visible`, `billable`, ...
