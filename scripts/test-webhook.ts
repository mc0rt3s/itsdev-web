#!/usr/bin/env node
/**
 * Script para testear el webhook de Clockify localmente
 * Uso: npx ts-node scripts/test-webhook.ts [--skip-seed]
 */

import * as prisma from '@prisma/client';
import prismaClient from '../src/lib/prisma';

const API_BASE = process.env.API_URL || 'http://localhost:3000';
const WEBHOOK_ENDPOINT = `${API_BASE}/api/clockify/webhook`;

interface TestTimeEntry {
  id: string;
  description: string;
  duration: number; // ms
  start: string;
  end: string;
  projectId: string;
  taskId: string;
  billable: boolean;
  status: string;
}

async function seedTestData() {
  console.log('🌱 Creando datos de test...');

  // Crear cliente
  const cliente = await prismaClient.cliente.create({
    data: {
      rut: '99999999-9',
      razonSocial: 'Test Client Inc',
      email: 'test@testclient.com',
      clockifyClientId: 'test-clockify-client-id',
      facturaPorTiempo: true,
    },
  });
  console.log(`✓ Cliente creado: ${cliente.id}`);

  // Crear proyecto
  const proyecto = await prismaClient.proyecto.create({
    data: {
      clienteId: cliente.id,
      nombre: 'Test Project',
      clockifyProjectId: 'test-clockify-project-id',
    },
  });
  console.log(`✓ Proyecto creado: ${proyecto.id}`);

  // Crear ClockifyTaskTipo
  const taskTipo = await prismaClient.clockifyTaskTipo.create({
    data: {
      clockifyTaskId: 'test-clockify-task-id',
      clockifyProjectId: proyecto.clockifyProjectId!,
      nombre: 'Test Task',
      tipoHora: 'habil',
    },
  });
  console.log(`✓ ClockifyTaskTipo creado: ${taskTipo.id}`);

  return { cliente, proyecto, taskTipo };
}

async function sendWebhookEvent(event: any): Promise<any> {
  try {
    const response = await fetch(WEBHOOK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });

    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { status: 'error', data: { error: message } };
  }
}

async function runTests() {
  try {
    console.log(`Testing webhook at: ${WEBHOOK_ENDPOINT}\n`);

    // Seed data
    const { cliente, proyecto, taskTipo } = await seedTestData();
    console.log('');

    // Test 1: Time entry completada (1 hora)
    console.log('📝 Test 1: TIME_ENTRY_UPDATED (1 hora, normal)');
    let result = await sendWebhookEvent({
      eventType: 'TIME_ENTRY_UPDATED',
      timeEntry: {
        id: 'clockify-entry-001',
        description: 'Desarrollo de login',
        duration: 3600000, // 1 hora en ms
        start: '2024-09-02T09:00:00Z',
        end: '2024-09-02T10:00:00Z',
        projectId: proyecto.clockifyProjectId,
        taskId: taskTipo.clockifyTaskId,
        billable: true,
        status: 'APPROVED',
      } as TestTimeEntry,
    });
    console.log(`  Status: ${result.status}`);
    console.log(`  Response: ${JSON.stringify(result.data, null, 2)}`);
    console.log('');

    // Test 2: Time entry de 2.5 horas
    console.log('📝 Test 2: TIME_ENTRY_UPDATED (2.5 horas)');
    result = await sendWebhookEvent({
      eventType: 'TIME_ENTRY_UPDATED',
      timeEntry: {
        id: 'clockify-entry-002',
        description: 'Implementar API de usuarios',
        duration: 9000000, // 2.5 horas en ms
        start: '2024-09-02T14:00:00Z',
        end: '2024-09-02T16:30:00Z',
        projectId: proyecto.clockifyProjectId,
        taskId: 'task-api-users-002',
        billable: true,
        status: 'APPROVED',
      } as TestTimeEntry,
    });
    console.log(`  Status: ${result.status}`);
    console.log(`  Response: ${JSON.stringify(result.data, null, 2)}`);
    console.log('');

    // Test 3: Evento ignorado (no TIME_ENTRY_UPDATED)
    console.log('📝 Test 3: Evento ignorado (NEW_TIMER_STARTED)');
    result = await sendWebhookEvent({
      eventType: 'NEW_TIMER_STARTED',
      timeEntry: { id: 'entry-003' },
    });
    console.log(`  Status: ${result.status}`);
    console.log(`  Response: ${JSON.stringify(result.data, null, 2)}`);
    console.log('');

    // Test 4: Proyecto no vinculado (error esperado)
    console.log('📝 Test 4: Proyecto no vinculado (error esperado)');
    result = await sendWebhookEvent({
      eventType: 'TIME_ENTRY_UPDATED',
      timeEntry: {
        id: 'clockify-entry-004',
        description: 'Task en proyecto desconocido',
        duration: 3600000,
        start: '2024-09-02T11:00:00Z',
        end: '2024-09-02T12:00:00Z',
        projectId: 'unknown-project-id',
        taskId: 'unknown-task-id',
        billable: true,
        status: 'APPROVED',
      } as TestTimeEntry,
    });
    console.log(`  Status: ${result.status}`);
    console.log(`  Response: ${JSON.stringify(result.data, null, 2)}`);
    console.log('');

    // Verificar entries creadas
    console.log('✅ Verificando FacturableEntries creadas:');
    const entries = await prismaClient.facturableEntry.findMany({
      where: { clienteId: cliente.id },
    });
    console.log(`  Total: ${entries.length} entries`);
    entries.forEach((e, i) => {
      console.log(`  ${i + 1}. ${e.descripcion} - ${e.horas}h - $${e.montoTotal} (${e.estado})`);
    });
    console.log('');

    console.log('✓ Tests completados exitosamente');
  } catch (error) {
    console.error('❌ Error en tests:', error);
    process.exit(1);
  } finally {
    await prismaClient.$disconnect();
  }
}

runTests();
