# Integración Cal.diy -> CRM (itsdev-web)

Cal.diy (citas.itsdev.cl) -> webhook -> Actividad tipo "reunion" -> (manual) Oportunidad.

## Webhook receptor
- Endpoint: `POST <CRM_URL>/api/webhooks/cal`
- Header de firma: `X-Cal-Signature-256: HMAC-SHA256(body_crudo, CAL_WEBHOOK_SECRET)` hex
- Eventos: `BOOKING_CREATED` / `RESCHEDULED` / `BOOKING_CANCELLED`
- Dedup por `uid` (guardado en notas). 401 si firma inválida.

## API
- `GET <CRM_URL>/api/reuniones` -> lista reuniones (auth)
- `POST <CRM_URL>/api/reuniones` -> convierte a Oportunidad (auth)
  body: { reunionId, clienteId?|crearCliente:{rut,razonSocial,...}, stageId? }

## Var de entorno
- CAL_WEBHOOK_SECRET=<valor> (en env de la app en Coolify)
- ESTRELLA_API_TOKEN (auth de la API, ya existente)

## Suscripción en Cal.diy (Dashboard -> Event Types -> Webhooks)
- URL: <CRM_URL>/api/webhooks/cal
- Header: X-Cal-Signature-256 (HMAC-SHA256)
- Eventos: BOOKING_CREATED, RESCHEDULED, BOOKING_CANCELLED
