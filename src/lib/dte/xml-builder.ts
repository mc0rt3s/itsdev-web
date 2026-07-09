import forge from 'node-forge';
import type { DteInput, CafData } from './types';

function trunc(s: string, n: number) { return s.slice(0, n); }
function ts(): string { return new Date().toISOString().slice(0, 19); }
function xmlEsc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function signTed(ddXml: string, cafPrivateKeyPem: string): string {
  const pk = forge.pki.privateKeyFromPem(cafPrivateKeyPem) as forge.pki.rsa.PrivateKey;
  const md = forge.md.sha1.create();
  md.update(ddXml, 'raw');
  return forge.util.encode64(pk.sign(md));
}

export function buildDteXml(input: DteInput, caf: CafData): string {
  const { tipoDte, folio, fechaEmision, fechaVenc, formaPago, emisor, receptor, items, montoNeto, iva, total, ordenCompra } = input;
  const docId = `F${String(tipoDte).padStart(3, '0')}T${folio}`;

  const detalle = items.map((item, i) => [
    `    <Detalle>`,
    `      <NroLinDet>${i + 1}</NroLinDet>`,
    `      <NmbItem>${xmlEsc(trunc(item.descripcion, 80))}</NmbItem>`,
    `      <QtyItem>${item.cantidad}</QtyItem>`,
    `      <UnmdItem>UN</UnmdItem>`,
    `      <PrcItem>${Math.round(item.precioUnit)}</PrcItem>`,
    `      <MontoItem>${Math.round(item.total)}</MontoItem>`,
    `    </Detalle>`,
  ].join('\n')).join('\n');

  const totales = tipoDte === 33
    ? [`<MntNeto>${Math.round(montoNeto)}</MntNeto>`, `<TasaIVA>19</TasaIVA>`, `<IVA>${Math.round(iva)}</IVA>`, `<MntTotal>${Math.round(total)}</MntTotal>`].join('\n        ')
    : [`<MntExe>${Math.round(total)}</MntExe>`, `<MntTotal>${Math.round(total)}</MntTotal>`].join('\n        ');

  const refOC = ordenCompra
    ? `\n    <Referencia>\n      <NroLinRef>1</NroLinRef>\n      <TpoDocRef>801</TpoDocRef>\n      <FolioRef>${xmlEsc(ordenCompra)}</FolioRef>\n    </Referencia>`
    : '';

  const fchVenc = formaPago === 2 ? `\n        <FchVenc>${fechaVenc}</FchVenc>` : '';

  // TED — el <DD> se firma con la clave privada del CAF
  const ddInner = [
    `<RE>${emisor.rutEmpresa}</RE>`,
    `<TD>${tipoDte}</TD>`,
    `<F>${folio}</F>`,
    `<FE>${fechaEmision}</FE>`,
    `<RR>${receptor.rut}</RR>`,
    `<RSR>${xmlEsc(trunc(receptor.razonSocial, 40))}</RSR>`,
    `<MNT>${Math.round(total)}</MNT>`,
    `<IT1>${xmlEsc(trunc(items[0]?.descripcion ?? '', 40))}</IT1>`,
    caf.cafXml,
    `<TSTED>${ts()}</TSTED>`,
  ].join('');

  const ddXml = `<DD>${ddInner}</DD>`;
  const frmt = signTed(ddXml, caf.cafPrivateKeyPem);
  const tedXml = `<TED version="1.0">${ddXml}<FRMT algoritmo="SHA1withRSA">${frmt}</FRMT></TED>`;

  return [
    `<?xml version="1.0" encoding="ISO-8859-1"?>`,
    `<DTE version="1.0">`,
    `  <Documento ID="${docId}">`,
    `    <Encabezado>`,
    `      <IdDoc>`,
    `        <TipoDTE>${tipoDte}</TipoDTE>`,
    `        <Folio>${folio}</Folio>`,
    `        <FchEmis>${fechaEmision}</FchEmis>`,
    `        <FmaPago>${formaPago}</FmaPago>${fchVenc}`,
    `      </IdDoc>`,
    `      <Emisor>`,
    `        <RUTEmisor>${emisor.rutEmpresa}</RUTEmisor>`,
    `        <RznSoc>${xmlEsc(emisor.razonSocial)}</RznSoc>`,
    `        <GiroEmis>${xmlEsc(emisor.giro)}</GiroEmis>`,
    `        <Acteco>${emisor.acteco}</Acteco>`,
    `        <DirOrigen>${xmlEsc(emisor.direccion)}</DirOrigen>`,
    `        <CmnaOrigen>${xmlEsc(emisor.comuna)}</CmnaOrigen>`,
    `        <CiudadOrigen>${xmlEsc(emisor.ciudad)}</CiudadOrigen>`,
    `      </Emisor>`,
    `      <Receptor>`,
    `        <RUTRecep>${receptor.rut}</RUTRecep>`,
    `        <RznSocRecep>${xmlEsc(receptor.razonSocial)}</RznSocRecep>`,
    receptor.giro     ? `        <GiroRecep>${xmlEsc(receptor.giro)}</GiroRecep>`     : '',
    receptor.direccion ? `        <DirRecep>${xmlEsc(receptor.direccion)}</DirRecep>` : '',
    receptor.comuna   ? `        <CmnaRecep>${xmlEsc(receptor.comuna)}</CmnaRecep>`  : '',
    `      </Receptor>`,
    `      <Totales>`,
    `        ${totales}`,
    `      </Totales>`,
    `    </Encabezado>`,
    detalle,
    refOC,
    `    ${tedXml}`,
    `  </Documento>`,
    `</DTE>`,
  ].filter(l => l !== '').join('\n');
}
