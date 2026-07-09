import { loadCertFromBase64, getSeed, getToken, signSeedFromCertData, createSiiHttpClient } from '@emisso/sii';
import prisma from '@/lib/prisma';
import { parseCafXml } from './caf';
import { buildDteXml } from './xml-builder';
import { loadCertKeys, signDteXml } from './xml-signer';
import { buildEnvioDte } from './envio-builder';
import { uploadEnvioDte } from './sii-upload';
import type { DteInput, EmitResult, SiiConfigData } from './types';

export type { DteInput, EmitResult, SiiConfigData };
export { parseCafXml };

export async function getSiiConfig(): Promise<SiiConfigData> {
  const cfg = await prisma.siiConfig.findFirst();
  if (!cfg) throw new Error('No hay configuración SII. Ve a Configuración → SII para cargarla.');
  return {
    certBase64:      cfg.certBase64,
    certPassword:    cfg.certPassword,
    rutFirmante:     cfg.rutFirmante,
    rutEmpresa:      cfg.rutEmpresa,
    razonSocial:     cfg.razonSocial,
    giro:            cfg.giro,
    acteco:          cfg.acteco,
    direccion:       cfg.direccion,
    comuna:          cfg.comuna,
    ciudad:          cfg.ciudad,
    fechaResolucion: cfg.fechaResolucion,
    numResolucion:   cfg.numResolucion,
    ambiente:        cfg.ambiente as 'certification' | 'production',
  };
}

export async function getNextFolio(tipoDte: number, ambiente: string): Promise<{ folio: number; cafId: string; cafXml: string; cafPrivateKeyPem: string }> {
  const caf = await prisma.siiCaf.findUnique({ where: { tipoDte_ambiente: { tipoDte, ambiente } } });
  if (!caf) throw new Error(`No hay CAF cargado para DTE tipo ${tipoDte} en ambiente ${ambiente}. Sube uno en Configuración → CAFs.`);

  const nextFolio = caf.folioActual + 1;
  if (nextFolio > caf.folioHasta) {
    throw new Error(`CAF tipo ${tipoDte} agotado (último folio: ${caf.folioHasta}). Sube un nuevo CAF.`);
  }

  const { cafXml, cafPrivateKeyPem } = parseCafXml(caf.xml);
  return { folio: nextFolio, cafId: caf.id, cafXml, cafPrivateKeyPem };
}

export async function incrementFolio(cafId: string): Promise<void> {
  await prisma.siiCaf.update({ where: { id: cafId }, data: { folioActual: { increment: 1 } } });
}

export async function authenticateFromBase64(certBase64: string, certPassword: string, env: 'certification' | 'production'): Promise<string> {
  const certData = loadCertFromBase64(certBase64, certPassword);
  const client = createSiiHttpClient({ rateLimitMs: 0 });
  const seed = await getSeed({ env, certPath: '', certPassword }, client);
  const signedSeed = signSeedFromCertData(seed, certData);
  const { token } = await getToken(signedSeed, { env, certPath: '', certPassword }, client);
  return token;
}

export async function emitirDte(input: DteInput): Promise<EmitResult> {
  const config = input.emisor;
  const { tipoDte } = input;

  // 1. Obtener el siguiente folio del CAF
  const { folio, cafId, cafXml, cafPrivateKeyPem } = await getNextFolio(tipoDte, config.ambiente);
  input = { ...input, folio };

  // 2. Cargar certificado
  const keys = loadCertKeys(config.certBase64, config.certPassword);

  // 3. Autenticar en SII
  const token = await authenticateFromBase64(config.certBase64, config.certPassword, config.ambiente);

  // 4. Construir DTE XML con TED
  const dteXml = buildDteXml(input, { tipoDte, folioDesde: 0, folioHasta: 0, rutEmisor: config.rutEmpresa, cafXml, cafPrivateKeyPem });

  // 5. Firmar el Documento con el certificado
  const docId = `F${String(tipoDte).padStart(3, '0')}T${folio}`;
  const signedDte = signDteXml(dteXml, keys, docId);

  // 6. Construir EnvioDTE y firmarlo
  const envioXml = buildEnvioDte(signedDte, tipoDte, config, keys);

  // 7. Subir al SII
  const result = await uploadEnvioDte(envioXml, config.rutEmpresa, token, config.ambiente, folio);

  // 8. Incrementar folio en DB (solo si el envío fue exitoso)
  await incrementFolio(cafId);

  return result;
}
