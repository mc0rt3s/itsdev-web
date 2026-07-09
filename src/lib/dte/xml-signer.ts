import { SignedXml } from 'xml-crypto';
import forge from 'node-forge';

export interface CertKeys {
  privateKeyPem: string;
  certPem: string;
}

export function loadCertKeys(certBase64: string, password: string): CertKeys {
  const derBytes = forge.util.decode64(certBase64);
  const asn1 = forge.asn1.fromDer(derBytes);
  const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, password);

  let privateKey: forge.pki.PrivateKey | null = null;
  let cert: forge.pki.Certificate | null = null;

  for (const safeContent of p12.safeContents) {
    for (const safeBag of safeContent.safeBags) {
      if (safeBag.type === forge.pki.oids.pkcs8ShroudedKeyBag && safeBag.key) {
        privateKey = safeBag.key;
      }
      if (safeBag.type === forge.pki.oids.certBag && safeBag.cert) {
        cert = safeBag.cert;
      }
    }
  }

  if (!privateKey || !cert) {
    throw new Error('No se pudo extraer la clave privada o el certificado del .p12');
  }

  return {
    privateKeyPem: forge.pki.privateKeyToPem(privateKey),
    certPem: forge.pki.certificateToPem(cert),
  };
}

export function signDteXml(dteXml: string, keys: CertKeys, docId: string): string {
  const sig = new SignedXml({
    privateKey: keys.privateKeyPem,
    publicCert: keys.certPem,
    canonicalizationAlgorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
    signatureAlgorithm: 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
  });

  sig.addReference({
    xpath: `//*[@ID="${docId}"]`,
    transforms: ['http://www.w3.org/TR/2001/REC-xml-c14n-20010315'],
    digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
  });

  sig.computeSignature(dteXml, {
    location: { reference: '//Documento', action: 'after' },
  });

  return sig.getSignedXml();
}
