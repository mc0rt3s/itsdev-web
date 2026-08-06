# Integración de agendamiento de citas — Decisión y plan de ejecución

**Contexto.** El módulo de citas de ItsDev necesita un agendador (booking). Se evaluó
**Cal.diy** (the open-source Calendly) contra **Calendly** (SaaS). Este doc condensa la
decisión de licencia y deja **ambos caminos listos para ejecutar** — la elección no
debe costar más trabajo.

## El problema de licencia (Cal.diy es AGPL-3.0)

Cal.diy está bajo **AGPL-3.0**. Dos cláusulas relevantes para un SaaS propietario:

1. **Network copyleft** (sección 13): si los usuarios interactúan con el servicio por
   red, hay que ofrecerles el código fuente completo de la instancia.
2. **Obra derivada por embedding**: incrustar el agendador dentro del CRM (iframe o
   bundle compartido) se considera que la UI del CRM *deriva* del agendador → riesgo de
   tener que liberar el **CRM completo** bajo AGPL.

### Opciones seguras
- **A. Calendly (SaaS, pago).** Cero riesgo de licencia. Embed oficial soportado por el
  proveedor (no es obra derivada problemática). Costo mensual.
- **B. Cal.diy standalone en subdominio.** Sin embed: el agendador vive en
  `citas.itsdev.cl` como un servicio separado, tal cual Calendly lo hace. La UI del CRM
  solo **enlaza** (link), no incrusta. Riesgo AGPL acotado al agendador standalone
  (sigue exigiendo ofrecer el fuente de esa instancia si la expones a usuarios finales,
  pero no contamina el CRM). El deploy es propio: necesitas PostgreSQL (ya hay en
  `itsdev-apps`/Supabase) + **Redis + SMTP** + subdominio + dominio base para el storefront.

### Opción NO recomendada
- Incrustar Cal.diy dentro del CRM (embed en bettershop/app-propietaria) → alto riesgo
  de liberar todo el CRM bajo AGPL.

## Plan de ejecución · Opción A (Calendly) — ~1 día
1. Crear cuenta Calendly + configurar eventos de citas (duración, disponibles, pago si
   aplica).
2. En el CRM: sección de citas con botón/link de Calendly oficial.
3. (Opcional) Webhook de Calendly → registro del evento en el CRM (tabla `cita`).
4. QA en staging, deploy.

## Plan de ejecución · Opción B (Cal.diy standalone) — 2-3 días
1. En `itsdev-apps`: levantar stack Cal.diy vía Coolify (template) con:
   - Postgres: reutilizar Supabase (`itsdev_web`) o DB dedicada `calcom`.
   - **Redis** (requisito de Cal.diy, no existe aún) — nuevo servicio.
   - **SMTP** (ya hay `mailserver` en `itsdev-apps`) + variables `EMAIL_*`.
   - `NEXTAUTH_SECRET` (secret generado), `CALENDSO_ENCRYPTION_KEY`, subdomain
     `citas.itsdev.cl`, dominio base para el storefront.
2. Migraciones de Cal.diy (`prisma migrate deploy`) + seed del usuario admin.
3. Configurar disponibilidad/tipos de evento del admin.
4. CRM: enlazar `citas.itsdev.cl` desde el módulo de citas (sin embed).
5. QA en staging (SMTP de prueba, booking de punta a punta), deploy.

## Dependencias nuevas (Opción B)
- **Redis** (no desplegado hoy) → hay que añadirlo en Coolify.
- **SMTP** ya existe (`mailserver` en `itsdev-apps`) → solo configurar credenciales.

## Recomendación
Si el objetivo es "agendar citas del administrador con clientes" y no hay antifricción
de costo → **A (Calendly)** es lo más simple y sin riesgo legal.
Si se quiere auto-hospedar y control total (y se acepta mantener el agendador standalone
y no incrustarlo) → **B (Cal.diy)**, respetando que el embed está fuera de alcance.
