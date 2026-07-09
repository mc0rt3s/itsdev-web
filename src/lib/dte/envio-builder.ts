import { SignedXml } from 'xml-crypto';
import type { SiiConfigData } from './types';
import type { CertKeys } from './xml-signer';

function ts(): string { return new Date().toISOString().slice(0, 19); }

export function buildEnvioDte(
  signedDteXml: string,
  tipoDte: number,
  config: SiiConfigData,
  keys: CertKeys,
): string {
  // Extraer solo el contenido del <DTE> firmado (sin declaración XML)
  const dteContent = signedDteXml.replace(/<\?xml[^?]*\?>\s*/, '');

  const caratula = [
    `    <Caratula version="1.0">`,
    `      <RutEmisor>${config.rutEmpresa}</RutEmisor>`,
    `      <RutEnvia>${config.rutFirmante}</RutEnvia>`,
    `      <RutReceptor>60803000-K</RutReceptor>`,
    `      <FchResol>${config.fechaResolucion}</FchResol>`,
    `      <NroResol>${config.numResolucion}</NroResol>`,
    `      <TmstFirmaEnv>${ts()}</TmstFirmaEnv>`,
    `      <SubTotDTE>`,
    `        <TpoDTE>${tipoDte}</TpoDTE>`,
    `        <NroDTE>1</NroDTE>`,
    `      </SubTotDTE>`,
    `    </Caratula>`,
  ].join('\n');

  const setDte = [
    `  <SetDTE ID="SetDoc">`,
    caratula,
    `    ${dteContent}`,
    `  </SetDTE>`,
  ].join('\n');

  const envioRaw = [
    `<?xml version="1.0" encoding="ISO-8859-1"?>`,
    `<EnvioDTE version="1.0" xmlns="http://www.sii.cl/SiiDte" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sii.cl/SiiDte EnvioDTE_v10.xsd">`,
    setDte,
    `</EnvioDTE>`,
  ].join('\n');

  // Firmar el SetDTE
  const sig = new SignedXml({
    privateKey: keys.privateKeyPem,
    publicCert: keys.certPem,
    canonicalizationAlgorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
    signatureAlgorithm: 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
  });

  sig.addReference({
    xpath: `//*[@ID="SetDoc"]`,
    transforms: ['http://www.w3.org/TR/2001/REC-xml-c14n-20010315'],
    digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
  });

  sig.computeSignature(envioRaw, {
    location: { reference: '//SetDTE', action: 'after' },
  });

  return sig.getSignedXml();
}
