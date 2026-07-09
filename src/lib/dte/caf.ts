import type { CafData } from './types';

function extractTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return m ? m[1].trim() : '';
}

function extractTagWithAttrs(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[\\s\\S]*?<\\/${tag}>`));
  return m ? m[0] : '';
}

export function parseCafXml(xml: string): CafData {
  const cafBlock = extractTagWithAttrs(xml, 'CAF');
  if (!cafBlock) throw new Error('CAF XML inválido: no se encontró el bloque <CAF>');

  const tipoDte = parseInt(extractTag(xml, 'TD'), 10);
  const folioDesde = parseInt(extractTag(xml, 'D'), 10);
  const folioHasta = parseInt(extractTag(xml, 'H'), 10);
  const rutEmisor = extractTag(xml, 'RE');
  const rsask = extractTag(xml, 'RSASK');

  if (!tipoDte || !folioDesde || !folioHasta || !rutEmisor) {
    throw new Error('CAF XML inválido: faltan campos obligatorios (TD, RNG, RE)');
  }
  if (!rsask) {
    throw new Error('CAF XML inválido: no se encontró la clave privada <RSASK>');
  }

  // La clave privada viene como PEM en RSASK o como base64 crudo.
  // Normalizamos a PEM RSA PRIVATE KEY.
  const cafPrivateKeyPem = rsask.includes('-----BEGIN')
    ? rsask
    : `-----BEGIN RSA PRIVATE KEY-----\n${rsask}\n-----END RSA PRIVATE KEY-----`;

  return { tipoDte, folioDesde, folioHasta, rutEmisor, cafXml: cafBlock, cafPrivateKeyPem };
}
