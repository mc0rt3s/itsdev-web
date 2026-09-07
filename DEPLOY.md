# Deploy a Producción con Dokploy + Nixpacks

## Pre-Deploy Checklist

### 1. Código
- [ ] Todos los cambios están commitados: `git status` (debe estar limpio)
- [ ] Branch `main` está actualizado: `git pull origin main`
- [ ] No hay archivos sin seguimiento en `.gitignore`

### 2. Variables de Entorno (Secrets en Dokploy)
Configurar en Dokploy Panel → Aplicación → Secrets:

**Críticas:**
```
DATABASE_URL=postgresql://user:pass@db-host:5432/itsdev_db
NEXTAUTH_SECRET=<generate: openssl rand -base64 32>
NEXTAUTH_URL=https://itsdev.cl
PUBLIC_APP_URL=https://itsdev.cl
```

**Clockify Integration:**
```
CLOCKIFY_API_KEY=<from https://clockify.me/user/settings>
CLOCKIFY_WORKSPACE_ID=<workspace ID>
```

**Email (Resend):**
```
RESEND_API_KEY=re_xxxxxxxxx
COTIZACION_NOTIFY_EMAILS=contacto@itsdev.cl
```

**SII / BaseAPI (si usa facturación):**
```
BASEAPI_API_KEY=sk_xxxxxxxxx
BASEAPI_RUT=<rut>
BASEAPI_PASSWORD=<password>
BASEAPI_CLAVE_CERTIFICADO=<cert-pass>
BASEAPI_RUT_EMPRESA=76732709-9
BASEAPI_AMBIENTE=production
```

**Seed (primera instalación):**
```
SEED_ADMIN_PASSWORD=<strong-password>
```

### 3. Build Settings en Dokploy
- **Builder**: Nixpacks (auto-detectado)
- **Build Command**: (dejado vacío - usa nixpacks.toml)
- **Start Command**: (dejado vacío - usa nixpacks.toml)
- **Install Command**: (dejado vacío)

Nixpacks detectará automáticamente:
- Node.js 20+ (package.json)
- npm/yarn (package-lock.json)
- Prisma (schema.prisma)
- next.config.ts

### 4. Base de Datos
**Prerequisito:** PostgreSQL 14+ debe estar corriendo y accesible.

En producción, ejecutar DESPUÉS del deploy:
```bash
# Ejecutar migraciones
npm run db:migrate

# (Opcional) Seed inicial si es primera vez
npm run db:seed
```

Esto se puede hacer vía:
- SSH en el contenedor
- Post-deployment hook en Dokploy (si está disponible)
- Script de inicialización

## Deploy Steps

### Opción A: Git Push (CI/CD automático)
```bash
git add -A
git commit -m "feat: Clockify integration v1.0"
git push origin main
```
Dokploy detecta el push y inicia build automático.

### Opción B: Manual via Dokploy Dashboard
1. Panel → Aplicaciones → itsdev-web
2. Click "Deploy"
3. Seleccionar rama `main`
4. Confirmar

## Post-Deploy

### 1. Ejecutar Migraciones
```bash
# SSH en el contenedor
docker exec -it <container-id> npm run db:migrate
# o desde Dokploy Console
npm run db:migrate
```

### 2. Verificar Health
```bash
curl https://itsdev.cl/api/health
# Expected: 200 OK
```

### 3. Validar Endpoints Críticos
- [ ] **Auth**: POST `/api/auth/signin` (sin errores)
- [ ] **Clockify**: GET `/api/clockify/workspaces` (necesita CLOCKIFY_API_KEY)
- [ ] **Clientes**: GET `/api/clientes` (requiere autenticación)

### 4. Configurar Webhook Clockify
En https://clockify.me/admin/edit-organization-settings:
1. Workspaces → Settings → Webhooks
2. URL: `https://itsdev.cl/api/clockify/webhook`
3. Event: `TIME_ENTRY_UPDATED`
4. Test: Crear time entry en Clockify y verificar log

## Troubleshooting

### Build falla con `better-sqlite3`
**Causa**: Falta compilador C++
**Solución**: Verificar `nixpacks.toml` tiene `nixPkgs = ["python3", "make", "g++", "pkg-config"]`

### Database connection error
**Causa**: DATABASE_URL inválido o BD no accesible
**Solución**:
```bash
# Verificar conexión
psql $DATABASE_URL -c "SELECT 1"
```

### Migrations pending
**Causa**: Cambios en schema.prisma no aplicados
**Solución**:
```bash
npm run db:migrate
# o si falla, rollback y retry
```

### Webhook 404
**Causa**: Endpoint no expuesto públicamente
**Solución**: Verificar DNS/proxy está redirigiendo correctamente a `/api/clockify/webhook`

## Rollback

Si algo falla post-deploy:

```bash
# Ver versión anterior
git log --oneline -5

# Revertir
git revert <commit-hash>
git push origin main
# Dokploy re-deploya automáticamente
```

## Performance Notes

- **Node.js**: 20-alpine (imagen base en Dockerfile)
- **Next.js**: Static generation + ISR para públicas
- **Prisma**: Connection pooling recomendado (PgBouncer en prod)
- **Uploads**: `/public/uploads` debe ser volumen persistente en Dokploy

## Security Checklist

- [ ] `NEXTAUTH_SECRET` generado con `openssl rand -base64 32`
- [ ] `DATABASE_URL` usa conexión SSL/TLS
- [ ] Variables sensibles NO están en `.env` (solo en Dokploy Secrets)
- [ ] CORS headers configurados correctamente en `next.config.ts`
- [ ] CSP headers removen referencias a dominios innecesarios
- [ ] Webhook signature validation implementado (TODO en route.ts)

---

**Contacto de Deploy**: Para issues durante deploy, check logs en Dokploy → Logs tab.
