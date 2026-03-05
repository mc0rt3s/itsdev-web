import prisma from '@/lib/prisma';

interface AuditLogInput {
  action: string;
  entity: string;
  entityId?: string | null;
  actorId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        actorId: input.actorId ?? null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });
  } catch (error) {
    console.error('No se pudo escribir audit log:', error);
  }
}
