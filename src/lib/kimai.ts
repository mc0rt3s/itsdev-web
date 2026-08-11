import prisma from '@/lib/prisma';

// Integración con Kimai (taxi.itsdev.cl) vía su REST API.
// El Cliente del CRM es la fuente única de la verdad; aquí se mantiene
// espejado un "customer" en Kimai usando el id del cliente como referencia
// externa estable (campo `number`) para que el sync sea idempotente.

const KIMAI_BASE_URL = process.env.KIMAI_URL || '';
const KIMAI_API_TOKEN = process.env.KIMAI_API_TOKEN || '';

export interface KimaiCustomer {
  id: number;
  name: string;
  number?: string | null;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  comment?: string | null;
  visible?: boolean;
  billable?: boolean;
  currency?: string;
  country?: string;
  timezone?: string;
}

export type KimaiSyncAction = 'created' | 'updated' | 'linked' | 'skipped';

export interface KimaiSyncResult {
  kimaiCustomerId: number | null;
  action: KimaiSyncAction;
}

/** True si la integración está habilitada (URL + token configurados). */
export function kimaiEnabled(): boolean {
  return Boolean(KIMAI_BASE_URL && KIMAI_API_TOKEN);
}

function kimaiBase(): string {
  return KIMAI_BASE_URL.replace(/\/+$/, '');
}

async function kimaiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${kimaiBase()}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${KIMAI_API_TOKEN}`,
      ...(init.headers || {}),
    },
  });

  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      detail =
        (body && (body.message || body.detail)) ||
        (body && Array.isArray(body.violations)
          ? body.violations.map((v: { propertyPath?: string; message?: string }) => `${v.propertyPath}: ${v.message}`).join(', ')
          : '');
    } catch {
      detail = await res.text().catch(() => '');
    }
    throw new Error(`Kimai API ${res.status}: ${detail || res.statusText}`);
  }

  return (await res.json()) as T;
}

/** Construye el payload de customer en Kimai a partir de un Cliente del CRM. */
function customerPayload(cliente: {
  id: string;
  razonSocial: string;
  email?: string | null;
  telefono?: string | null;
  contacto?: string | null;
}): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: cliente.razonSocial,
    company: cliente.razonSocial,
    number: cliente.id, // Referencia externa estable (id del CRM) para dedupe
    timezone: 'America/Santiago',
    currency: 'CLP',
    country: 'CL',
    visible: true,
    billable: true,
  };
  if (cliente.email) payload.email = cliente.email;
  if (cliente.telefono) payload.mobile = cliente.telefono;
  if (cliente.contacto) payload.contact = cliente.contacto;
  return payload;
}

/** Busca un customer de Kimai por su referencia externa (`number` = id del CRM). */
export async function findKimaiCustomerByNumber(number: string): Promise<KimaiCustomer | null> {
  const customers = await kimaiFetch<KimaiCustomer[]>(`/api/customers?number=${encodeURIComponent(number)}`);
  return customers.find((c) => c.number === number) ?? null;
}

export async function createKimaiCustomer(
  payload: Record<string, unknown>
): Promise<KimaiCustomer> {
  return kimaiFetch<KimaiCustomer>('/api/customers', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateKimaiCustomer(
  id: number,
  payload: Record<string, unknown>
): Promise<KimaiCustomer> {
  return kimaiFetch<KimaiCustomer>(`/api/customers/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
}

/**
 * Sincroniza un Cliente del CRM hacia Kimai: crea el customer si no existe
 * (buscando por `number` = id del cliente) o lo actualiza si ya está vinculado.
 * Persiste `kimaiCustomerId` en el Cliente. Lanza si Kimai falla (el caller decide
 * si bloquear o degradar).
 */
export async function syncClienteToKimai(clienteId: string): Promise<KimaiSyncResult> {
  if (!kimaiEnabled()) return { kimaiCustomerId: null, action: 'skipped' };

  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente) throw new Error('Cliente no encontrado');

  const payload = customerPayload(cliente);

  // Si ya está vinculado, solo actualizar datos.
  if (cliente.kimaiCustomerId) {
    await updateKimaiCustomer(Number(cliente.kimaiCustomerId), payload);
    return { kimaiCustomerId: Number(cliente.kimaiCustomerId), action: 'updated' };
  }

  // Buscar por referencia externa para no duplicar (ids estables del CRM).
  const existing = await findKimaiCustomerByNumber(cliente.id);
  if (existing) {
    await updateKimaiCustomer(existing.id, payload);
    await prisma.cliente.update({
      where: { id: clienteId },
      data: { kimaiCustomerId: String(existing.id) },
    });
    return { kimaiCustomerId: existing.id, action: 'linked' };
  }

  const created = await createKimaiCustomer(payload);
  await prisma.cliente.update({
    where: { id: clienteId },
    data: { kimaiCustomerId: String(created.id) },
  });
  return { kimaiCustomerId: created.id, action: 'created' };
}
