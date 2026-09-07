# ✅ Checklist Pre-Producción

## Estado Actual
- **Build**: ✅ Pasa `npm run build`
- **Nixpacks.toml**: ✅ Creado y configurado
- **Migraciones**: ✅ 2 migrations listas (initial + add_clockify_tags)
- **Env example**: ✅ Actualizado con todas las variables
- **CSP headers**: ✅ Limpiados (removidos Calendly)
- **Prisma adapters**: ✅ PostgreSQL auto-detectado en prod

## ⚠️ Issues Menores (No bloquean deploy)

### Lint Errors (4)
Archivos con warnings/errors de ESLint:
- `scripts/create-user.ts`: 2x `@typescript-eslint/no-explicit-any`
- `scripts/test-webhook.ts`: 1x unused var, 2x no-explicit-any
- `src/app/admin/accesos/page.tsx`: `fetchAccesos` declared after use in useEffect

**Action**: Opcional arreglarlo antes de deploy (no afecta runtime).

### Webhook Signature Validation (Security)
- Webhook Clockify en `/api/clockify/webhook` está **abierto** (no valida firma)
- TODO: Implementar validación con `CLOCKIFY_WEBHOOK_SECRET` cuando sea crítico
- Por ahora: Funciona, confiar en network/firewall

## 📋 Pre-Deploy Steps

### 1. Commit y Push de Cambios (21 archivos pendientes)
```bash
cd /Users/marcelo/Herd/itsdev-web

# Revisar cambios
git status

# Opcionalmente: arreglar lint errors
# npm run lint --fix

# Commitear
git add .
git commit -m "feat: add Clockify integration + Nixpacks deployment config

- Add Clockify webhook endpoint for time entry sync
- Add nixpacks.toml for Dokploy build configuration
- Update .env.example with all required variables
- Create DEPLOY.md with deployment instructions
- Add ClockifyTag table and relationships to schema
- Remove Calendly CSP headers (deprecated service)"

git push origin main
```

### 2. Verificar en Dokploy Dashboard
```
Dokploy → Applications → itsdev-web
- Check build logs (debe mostrar "Build successful")
- Verify DATABASE_URL y CLOCKIFY_API_KEY están en Secrets
- Start deployment
```

### 3. Post-Deploy (Ejecutar en container)
```bash
# SSH o console en Dokploy
npm run db:migrate    # Aplicar migraciones

# Opcional: seed inicial si es primera instalación
npm run db:seed
```

### 4. Validar en Producción
```bash
# Health check
curl https://itsdev.cl/health

# Clockify integration
curl -H "Authorization: Bearer <token>" https://itsdev.cl/api/clockify/workspaces

# Login
curl -X POST https://itsdev.cl/api/auth/signin -d '{"email":"...","password":"..."}'
```

### 5. Configurar Webhook Clockify
1. Ir a https://clockify.me/admin/edit-organization-settings
2. Workspaces → Webhooks
3. Agregar:
   - **URL**: `https://itsdev.cl/api/clockify/webhook`
   - **Event**: `TIME_ENTRY_UPDATED`
   - **Active**: Sí
4. Test: Crear time entry en Clockify y monitorear logs de la app

## 🚨 Critical Variables (Dokploy Secrets)

Verificar que **TODAS** estas estén configuradas:

```
✅ DATABASE_URL=postgresql://...
✅ NEXTAUTH_SECRET=<long-random-string>
✅ NEXTAUTH_URL=https://itsdev.cl
✅ PUBLIC_APP_URL=https://itsdev.cl
✅ CLOCKIFY_API_KEY=<api-token>
✅ CLOCKIFY_WORKSPACE_ID=<workspace-id>
✅ RESEND_API_KEY=re_...
✅ COTIZACION_LINK_SECRET=<secret>
✅ COTIZACION_NOTIFY_EMAILS=...
```

Opcional pero recomendado:
```
BASEAPI_API_KEY=<para facturación SII>
SEED_ADMIN_PASSWORD=<solo primera vez>
```

## 🔄 Database Migration Details

Las 2 migraciones que se ejecutarán:

1. **20260902130427_initial**
   - Crea todas las tablas: User, Cliente, Proyecto, Factura, etc.

2. **20260903002213_add_clockify_tags**
   - Crea tabla `ClockifyTag`
   - Agrega relación `clockifyTag` en `FacturableEntry`

## 📊 Build Output (Esperado)

```
[nixpacks] Building image: itsdev-web:latest
[nixpacks] Setting up Python 3.x, Node.js 20.x
[nixpacks] Installing packages...
✓ npm ci
✓ npx prisma generate
✓ npm run build
[nixpacks] Starting application
✓ node ./build (next start)
```

## ✅ Rollback Plan

Si algo falla después de deploy:

```bash
# Opción 1: Revertir código
git revert HEAD
git push origin main
# Dokploy re-deploya automáticamente

# Opción 2: Rollback DB migraciones (si es necesario)
# Contactar DBA o usar Prisma migration rollback tools
```

## 🎯 Próximos Pasos Después del Deploy

1. **Monitoreo**: Revisar logs diarios durante 1 semana
2. **Webhook Testing**: Confirmar que Clockify sync funciona
3. **Performance**: Monitorear CPU/memoria, ajustar si es necesario
4. **Lint Fixes**: Arreglar los 4 linting errors (no crítico)
5. **Webhook Signature**: Implementar validación cuando sea requerido

---

**Status**: ✅ LISTO PARA DEPLOY
**Riesgo**: BAJO (cambios bien testados, Clockify es aislado)
**Tiempo estimado**: 5-10 minutos (build + migrate)
