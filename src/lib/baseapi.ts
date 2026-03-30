interface BaseApiConfig {
  baseUrl: string;
  apiKey: string;
  rut: string;
  password: string;
  claveCertificado: string;
  rutEmpresa: string;
  ambiente: string;
}

interface EmitirDteItem {
  nombre: string;
  cantidad: number;
  precio: number;
  unidad?: string;
  descripcion_extendida?: string;
}

interface EmitirDtePayload {
  receptor: {
    rut: string;
    contacto?: string;
  };
  items: EmitirDteItem[];
  forma_pago?: 'CONTADO' | 'CREDITO' | 'SIN_COSTO';
  fecha_emision?: string;
  pagos?: Array<{ fecha: string; monto: number; glosa?: string }>;
  descargar_pdf?: boolean;
}

export interface BaseApiEmitResult {
  success: boolean;
  folio?: string | number | null;
  trackId?: string | number | null;
  pdfBase64?: string | null;
  raw: unknown;
}

async function parseBaseApiResponse(response: Response) {
  return response.json().catch(async () => {
    const text = await response.text().catch(() => '');
    return { success: false, message: text };
  });
}

async function fetchBaseApiJson(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  timeoutMessage: string,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });

    const raw = await parseBaseApiResponse(response);
    return { response, raw };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(timeoutMessage);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function getBaseApiErrorMessage(raw: unknown, status: number) {
  if (typeof raw === 'object' && raw !== null) {
    const candidate = raw as { message?: unknown; error?: unknown };
    if (typeof candidate.message === 'string' && candidate.message.trim()) {
      return candidate.message;
    }
    if (typeof candidate.error === 'string' && candidate.error.trim()) {
      return candidate.error;
    }
  }
  return `BaseAPI respondió ${status}`;
}

function isRetryableBaseApiMessage(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes('execution context was destroyed')
    || normalized.includes('most likely because of a navigation')
    || normalized.includes('navigation');
}

export function getBaseApiConfig(): BaseApiConfig {
  const baseUrl = process.env.BASEAPI_BASE_URL?.trim() || 'https://api.baseapi.cl';
  const apiKey = process.env.BASEAPI_API_KEY?.trim();
  const rut = process.env.BASEAPI_RUT?.trim();
  const password = process.env.BASEAPI_PASSWORD?.trim();
  const claveCertificado = process.env.BASEAPI_CLAVE_CERTIFICADO?.trim();
  const rutEmpresa = process.env.BASEAPI_RUT_EMPRESA?.trim();
  const ambiente = process.env.BASEAPI_AMBIENTE?.trim() || 'sandbox';

  if (!apiKey || !rut || !password || !claveCertificado || !rutEmpresa) {
    throw new Error('Faltan variables BaseAPI: BASEAPI_API_KEY, BASEAPI_RUT, BASEAPI_PASSWORD, BASEAPI_CLAVE_CERTIFICADO, BASEAPI_RUT_EMPRESA');
  }

  return { baseUrl, apiKey, rut, password, claveCertificado, rutEmpresa, ambiente };
}

function toJsonStringSafe(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export async function baseApiGetEmisor() {
  const config = getBaseApiConfig();
  const { response, raw } = await fetchBaseApiJson(
    `${config.baseUrl}/api/v1/sii/dte/emisor`,
    {
      method: 'POST',
      headers: {
        'X-API-Key': config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rut: config.rut,
        password: config.password,
        rut_empresa: config.rutEmpresa,
      }),
    },
    20_000,
    'BaseAPI demoró demasiado al consultar el emisor'
  );

  if (!response.ok) {
    throw new Error(typeof raw?.message === 'string' ? raw.message : 'No se pudo consultar emisor en BaseAPI');
  }

  return raw;
}

export async function baseApiEmitFactura(payload: EmitirDtePayload, afectaIva: boolean): Promise<BaseApiEmitResult> {
  const config = getBaseApiConfig();
  const endpoint = afectaIva ? 'factura' : 'factura-exenta';
  const requestBody = {
    rut: config.rut,
    password: config.password,
    clave_certificado: config.claveCertificado,
    rut_empresa: config.rutEmpresa,
    descargar_pdf: false,
    ...payload,
  };

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const { response, raw } = await fetchBaseApiJson(
      `${config.baseUrl}/api/v1/sii/dte/emitir/${endpoint}`,
      {
        method: 'POST',
        headers: {
          'X-API-Key': config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      },
      90_000,
      'BaseAPI demoró demasiado al emitir la factura en SII'
    );

    if (response.ok) {
      const data = raw?.data ?? raw;
      return {
        success: Boolean(raw?.success ?? true),
        folio: data?.folio ?? data?.numero ?? null,
        trackId: data?.track_id ?? data?.trackId ?? null,
        pdfBase64: data?.pdf_base64 ?? data?.pdf ?? null,
        raw,
      };
    }

    const message = getBaseApiErrorMessage(raw, response.status);
    if (attempt === 1 && isRetryableBaseApiMessage(message)) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      continue;
    }

    throw new Error(message);
  }

  throw new Error('BaseAPI no respondió correctamente al emitir la factura');
}

export function truncateItemName(value: string) {
  const trimmed = value.trim();
  return trimmed.length <= 25 ? trimmed : trimmed.slice(0, 25).trimEnd();
}

export function summarizeBaseApiResponse(raw: unknown) {
  const text = toJsonStringSafe(raw);
  return text.length <= 3000 ? text : `${text.slice(0, 3000)}...`;
}
