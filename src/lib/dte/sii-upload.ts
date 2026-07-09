import type { EmitResult } from './types';

const ENDPOINTS = {
  certification: 'https://maullin.sii.cl/cgi_dte/UPL/DTEUpload',
  production:    'https://palena.sii.cl/cgi_dte/UPL/DTEUpload',
};

function extractXmlTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return m ? m[1].trim() : '';
}

export async function uploadEnvioDte(
  envioXml: string,
  rutEmpresa: string,
  token: string,
  ambiente: 'certification' | 'production',
  folio: number,
): Promise<EmitResult> {
  const [rutBody, dv] = rutEmpresa.split('-');

  const form = new FormData();
  form.append('rutSender', rutBody);
  form.append('dvSender', dv);
  form.append('rutCompany', rutBody);
  form.append('dvCompany', dv);
  form.append('archivo', new Blob([envioXml], { type: 'text/xml' }), 'envio.xml');

  const url = ENDPOINTS[ambiente];
  const res = await fetch(url, {
    method: 'POST',
    headers: { Cookie: `TOKEN=${token}` },
    body: form,
  });

  if (!res.ok) {
    throw new Error(`SII respondió ${res.status} al subir el EnvioDTE`);
  }

  const text = await res.text();
  const estado = extractXmlTag(text, 'ESTADO');
  const trackId = extractXmlTag(text, 'TRACKID');
  const estadoMsg = extractXmlTag(text, 'GLOSA') || extractXmlTag(text, 'ESTADODOC');

  // Estado 0 = aceptado, negativo = error
  const estadoNum = parseInt(estado, 10);
  if (estadoNum < 0) {
    throw new Error(`SII rechazó el envío (estado ${estado}): ${estadoMsg}`);
  }

  return {
    folio,
    trackId: trackId || `${Date.now()}`,
    estado: estadoNum === 0 ? 'EPR' : estado,
    ambiente,
  };
}
