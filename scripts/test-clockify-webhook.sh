#!/bin/bash

# Script para testear el webhook de Clockify localmente sin necesidad de ngrok

API_URL="${1:-http://localhost:3000}"
ENDPOINT="/api/clockify/webhook"

echo "Testing Clockify webhook at: $API_URL$ENDPOINT"
echo ""

# Test 1: Evento TIME_ENTRY_UPDATED sin proyecto vinculado (error esperado)
echo "Test 1: TIME_ENTRY_UPDATED (sin proyecto vinculado)"
curl -X POST "$API_URL$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "TIME_ENTRY_UPDATED",
    "timeEntry": {
      "id": "clockify-entry-001",
      "description": "Desarrollo feature login",
      "duration": 7200000,
      "start": "2024-09-02T09:00:00Z",
      "end": "2024-09-02T11:00:00Z",
      "projectId": "unknown-proj-123",
      "taskId": "task-login-001",
      "billable": true,
      "status": "APPROVED"
    }
  }' | jq .
echo ""
echo ""

# Test 2: Evento no TIME_ENTRY_UPDATED (debe ignorarse)
echo "Test 2: Evento ignorado (NEW_TIMER_STARTED)"
curl -X POST "$API_URL$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "NEW_TIMER_STARTED",
    "timeEntry": {
      "id": "clockify-entry-002"
    }
  }' | jq .
echo ""
echo ""

# Test 3: Payload inválido (sin timeEntry)
echo "Test 3: Payload inválido (sin timeEntry)"
curl -X POST "$API_URL$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "TIME_ENTRY_UPDATED"
  }' | jq .
echo ""
echo ""

echo "✓ Tests completados."
echo ""
echo "Nota: Para testear con un cliente real, primero crea un Proyecto en la BD"
echo "con el clockifyProjectId que usas en Clockify, luego vincula un Cliente a ese Proyecto."
echo ""
echo "Ejemplo de inserción en BD (SQLite):"
echo "  INSERT INTO Cliente (id, rut, razonSocial, clockifyClientId) VALUES ('client-123', '76.XXX.XXX-K', 'Acme Corp', 'acme-clockify-id');"
echo "  INSERT INTO Proyecto (id, clienteId, nombre, clockifyProjectId) VALUES ('proj-456', 'client-123', 'Website', 'website-clockify-proj-id');"
