#!/bin/bash
# Script para hacer backup de la base de datos de producción

CONTAINER_NAME="itsdev-web"
BACKUP_DIR="/opt/itsdev/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

# Hacer backup de la base de datos
echo "🔄 Creando backup de la base de datos..."
docker exec "$CONTAINER_NAME" cp /app/data/prod.db /app/data/prod.db.backup.$TIMESTAMP

# Copiar backup fuera del contenedor
docker cp "$CONTAINER_NAME:/app/data/prod.db.backup.$TIMESTAMP" "$BACKUP_DIR/prod.db.$TIMESTAMP"

echo "✅ Backup creado en: $BACKUP_DIR/prod.db.$TIMESTAMP"

# Limpiar backups antiguos (mantener solo los últimos 7 días)
find "$BACKUP_DIR" -name "prod.db.*" -mtime +7 -delete
echo "🧹 Backups antiguos eliminados"
