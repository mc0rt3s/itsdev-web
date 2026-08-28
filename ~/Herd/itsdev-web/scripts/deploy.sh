#!/bin/bash
# Deploy itsdev-web a servidor

set -e

REMOTE_USER="root"
REMOTE_HOST="itsdev-apps"
REMOTE_PATH="/opt/itsdev/itsdev-web/app"

echo "🚀 Deploying itsdev-web..."

# 1. Sync código
echo "📦 Syncing code..."
rsync -azh --delete \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.env.local \
  --exclude=.git \
  ~/Herd/itsdev-web/ \
  $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/

# 2. Rebuild + restart
echo "🔨 Rebuilding..."
ssh $REMOTE_USER@$REMOTE_HOST << 'EOF'
cd /opt/itsdev/itsdev-web
docker compose down
docker compose up -d --build
sleep 30
docker compose ps
EOF

echo "✅ Deploy complete!"
echo "🌐 Access: http://www.itsdev.cl"
