export interface SiiConfigData {
  certBase64: string;
  certPassword: string;
  rutFirmante: string;
  rutEmpresa: string;
  razonSocial: string;
  giro: string;
  acteco: number;
  direccion: string;
  comuna: string;
  ciudad: string;
  fechaResolucion: string;
  numResolucion: number;
  ambiente: 'certification' | 'production';
}

export interface CafData {
  tipoDte: number;
  folioDesde: number;
  folioHasta: number;
  rutEmisor: string;
  cafXml: string;       // bloque <CAF>...</CAF> completo (DA + FRMA), sin RSASK
  cafPrivateKeyPem: string; // contenido de <RSASK> como PEM
}

export interface DteReceptor {
  rut: string;
  razonSocial: string;
  giro?: string;
  direccion?: string;
  comuna?: string;
}

export interface DteItem {
  descripcion: string;
  cantidad: number;
  precioUnit: number;
  total: number;
}

export interface DteInput {
  tipoDte: 33 | 34;
  folio: number;
  fechaEmision: string;    // YYYY-MM-DD
  fechaVenc: string;       // YYYY-MM-DD
  formaPago: 1 | 2 | 3;   // 1=contado 2=crédito 3=sin_costo
  emisor: SiiConfigData;
  receptor: DteReceptor;
  items: DteItem[];
  montoNeto: number;
  iva: number;
  total: number;
  ordenCompra?: string;
}

export interface EmitResult {
  folio: number;
  trackId: string;
  estado: string;
  ambiente: string;
}
