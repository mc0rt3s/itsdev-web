# Guía de Despliegue a Producción

## ✅ Checklist Pre-Despliegue

- [x] Todas las migraciones de Prisma creadas
- [x] Base de datos en volumen persistente (`itsdev-data`)
- [x] Recharts instalado y funcionando
- [x] Nuevo módulo de Gastos implementado
- [x] Dashboard con gráficos de flujo de caja
- [x] Directorio de uploads configurado

## 📋 Pasos para Desplegar

### 1. Backup de la Base de Datos (RECOMENDADO)

```bash
# En el servidor de producción
docker exec itsdev-web cp /app/data/prod.db /app/data/prod.db.backup.$(date +%Y%m%d_%H%M%S)
```

### 2. Subir Cambios al Repositorio

```bash
git add .
git commit -m "feat: Agregar módulo de Gastos y gráficos de flujo de caja"
git push origin main
```

### 3. En el Servidor de Producción

```bash
# Ir al directorio del proyecto
cd /opt/itsdev/apps/itsdev-web

# Hacer pull de los cambios
git pull origin main

# Reconstruir la imagen (esto aplicará las migraciones automáticamente)
docker compose build --no-cache

# Detener el contenedor actual
docker compose down

# Iniciar con la nueva imagen
docker compose up -d

# Verificar que las migraciones se aplicaron correctamente
docker logs itsdev-web | grep -i migration

# Verificar que el contenedor está corriendo
docker ps | grep itsdev-web
```

### 4. Verificar Migraciones

Las migraciones se aplican automáticamente al iniciar el contenedor gracias a:
```dockerfile
CMD ["sh", "-c", "prisma migrate deploy && node server.js"]
```

Esto ejecuta `prisma migrate deploy` que:
- ✅ Solo aplica migraciones pendientes
- ✅ NO modifica datos existentes
- ✅ Es seguro para producción

### 5. Verificar Funcionalidad

1. Acceder a https://itsdev.cl/admin
2. Verificar que el dashboard muestra los gráficos
3. Verificar que el módulo de Gastos funciona
4. Verificar que los datos existentes siguen ahí

## 🔒 Seguridad de Datos

- **Volumen Docker**: La base de datos está en `itsdev-data` que persiste independientemente del contenedor
- **Migraciones**: Prisma solo agrega nuevas tablas/campos, no elimina datos
- **Backup**: Se recomienda hacer backup antes de cada despliegue

## 📝 Migraciones Pendientes

Las siguientes migraciones se aplicarán automáticamente:

1. `20260127212047_update_factura_estado_default` - Actualiza estado por defecto
2. `20260127213054_add_numero_sii_factura` - Agrega campo numeroSII
3. `20260127222132_add_gastos` - Agrega tabla de Gastos

Todas son **NO DESTRUCTIVAS** - solo agregan campos/tablas nuevas.

## 🐛 Troubleshooting

### Si el contenedor no inicia:

```bash
# Ver logs
docker logs itsdev-web

# Verificar migraciones
docker exec itsdev-web npx prisma migrate status
```

### Si hay problemas con migraciones:

```bash
# Aplicar migraciones manualmente
docker exec itsdev-web npx prisma migrate deploy
```

### Restaurar backup:

```bash
# Detener contenedor
docker compose down

# Restaurar backup
docker run --rm -v itsdev-web_itsdev-data:/data -v $(pwd):/backup alpine cp /backup/prod.db.backup.XXXXXX /data/prod.db

# Reiniciar
docker compose up -d
```
