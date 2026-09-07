'use client';

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  Font,
} from '@react-pdf/renderer';
import { styles, formatters, COLORS } from './CotizacionPDFStyles';

// Tipos
export interface ClienteInfo {
  razonSocial: string;
  rut?: string | null;
  email?: string | null;
  contacto?: string | null;
}

export interface ItemCotizacion {
  sku?: string | null;
  descripcion: string;
  cantidad: number;
  precioUnit: number;
  total: number;
}

export interface CotizacionPDFProps {
  numero: string;
  fecha: string;
  validez: string;
  cliente?: ClienteInfo | null;
  nombreProspecto?: string | null;
  emailProspecto?: string | null;
  etiquetaComercial?: string | null;
  oportunidad?: string | null;
  items: ItemCotizacion[];
  subtotal: number;
  descuento?: number | null;
  impuesto: number;
  total: number;
  moneda?: string;
  modoEnvio?: string | null;
  fechaEntrega?: string | null;
  formaPago?: string | null;
  duracionValidezDias?: number | null;
  notas?: string | null;
  logoBase64?: string;
}

// ============================================
// COMPONENTES REUTILIZABLES
// ============================================

interface HeaderProps {
  fecha: string;
  logoBase64?: string;
}

const Header: React.FC<HeaderProps> = ({ fecha, logoBase64 }) => (
  <View style={styles.headerContainer}>
    <View style={styles.headerLeft}>
      {logoBase64 ? (
        <Image src={logoBase64} style={styles.logo} />
      ) : (
        <Text style={styles.headerTitle}>ITSDev</Text>
      )}
      <View>
        <Text style={styles.headerTitle}>COTIZACIÓN</Text>
        <Text style={styles.headerSubtitle}>Servicios Informáticos</Text>
      </View>
    </View>
    <View style={styles.headerDate}>
      <Text>{formatters.shortDate(fecha)}</Text>
    </View>
  </View>
);

interface ClientInfoProps {
  cliente?: ClienteInfo | null;
  nombreProspecto?: string | null;
  emailProspecto?: string | null;
  numero: string;
  fecha: string;
  validez: string;
  etiquetaComercial?: string | null;
  oportunidad?: string | null;
}

const ClientInfo: React.FC<ClientInfoProps> = ({
  cliente,
  nombreProspecto,
  emailProspecto,
  numero,
  fecha,
  validez,
  etiquetaComercial,
  oportunidad,
}) => {
  const clientName = cliente?.razonSocial || nombreProspecto || 'Prospecto';
  const clientEmail = cliente?.email || emailProspecto || 'No especificado';
  const clientContacto = cliente?.contacto || 'No especificado';
  const clientRUT = cliente?.rut || '-';

  return (
    <View style={styles.clientInfoContainer}>
      {/* COLUMNA IZQUIERDA: CLIENTE */}
      <View style={styles.clientColumn}>
        <Text style={styles.infoLabel}>Cliente</Text>
        <View style={styles.infoField}>
          <Text style={styles.infoFieldValue}>{clientName}</Text>
        </View>
        <View style={styles.infoField}>
          <Text style={styles.infoFieldLabel}>RUT</Text>
          <Text style={styles.infoFieldValue}>{formatters.rut(clientRUT)}</Text>
        </View>
        <View style={styles.infoField}>
          <Text style={styles.infoFieldLabel}>Contacto</Text>
          <Text style={styles.infoFieldValue}>{clientContacto}</Text>
        </View>
        <View style={styles.infoField}>
          <Text style={styles.infoFieldLabel}>Email</Text>
          <Text style={styles.infoFieldValue}>{clientEmail}</Text>
        </View>
      </View>

      {/* COLUMNA DERECHA: COTIZACIÓN */}
      <View style={styles.clientColumn}>
        <Text style={styles.infoLabel}>Cotización</Text>
        <View style={styles.infoField}>
          <Text style={styles.infoFieldLabel}>Número</Text>
          <Text style={styles.infoFieldValue}>{numero}</Text>
        </View>
        <View style={styles.infoField}>
          <Text style={styles.infoFieldLabel}>Fecha emisión</Text>
          <Text style={styles.infoFieldValue}>{formatters.date(fecha)}</Text>
        </View>
        <View style={styles.infoField}>
          <Text style={styles.infoFieldLabel}>Validez</Text>
          <Text style={styles.infoFieldValue}>{formatters.date(validez)}</Text>
        </View>
        {etiquetaComercial && (
          <View style={styles.infoField}>
            <Text style={styles.infoFieldLabel}>Etiqueta</Text>
            <Text style={styles.infoFieldValue}>{etiquetaComercial}</Text>
          </View>
        )}
        {oportunidad && (
          <View style={styles.infoField}>
            <Text style={styles.infoFieldLabel}>Oportunidad</Text>
            <Text style={styles.infoFieldValue}>{oportunidad}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

interface ItemsTableProps {
  items: ItemCotizacion[];
}

const ItemsTable: React.FC<ItemsTableProps> = ({ items }) => {
  const hasSku = items.some((i) => i.sku && i.sku.trim() !== '');

  return (
    <View style={styles.tableContainer}>
      {/* ENCABEZADO */}
      <View style={styles.tableHeader}>
        <View style={{ flex: 0.5 }}>
          <Text style={[styles.tableHeaderCell, styles.tableCellCenter]}>N</Text>
        </View>
        {hasSku && (
          <View style={{ flex: 1 }}>
            <Text style={[styles.tableHeaderCell, styles.tableCellCenter]}>SKU</Text>
          </View>
        )}
        <View style={{ flex: hasSku ? 3 : 4 }}>
          <Text style={[styles.tableHeaderCell, styles.tableCellCenter]}>DESCRIPCIÓN</Text>
        </View>
        <View style={{ flex: 0.8 }}>
          <Text style={[styles.tableHeaderCell, styles.tableCellCenter]}>CANT.</Text>
        </View>
        <View style={{ flex: 1.2 }}>
          <Text style={[styles.tableHeaderCell, styles.tableCellRight]}>P. UNIT.</Text>
        </View>
        <View style={{ flex: 1.2 }}>
          <Text style={[styles.tableHeaderCell, styles.tableCellRight]}>TOTAL</Text>
        </View>
      </View>

      {/* FILAS */}
      {items.map((item, idx) => (
        <View
          key={idx}
          style={[styles.tableRow, idx === items.length - 1 && styles.tableRowLast]}
        >
          <View style={{ flex: 0.5 }}>
            <Text style={[styles.tableCell, styles.tableCellCenter, styles.tableCellNumber]}>
              {String(idx + 1).padStart(2, '0')}
            </Text>
          </View>
          {hasSku && (
            <View style={{ flex: 1 }}>
              <Text style={[styles.tableCell, styles.tableCellCenter]}>
                {item.sku || '-'}
              </Text>
            </View>
          )}
          <View style={{ flex: hasSku ? 3 : 4 }}>
            <Text style={[styles.tableCell]}>{item.descripcion}</Text>
          </View>
          <View style={{ flex: 0.8 }}>
            <Text style={[styles.tableCell, styles.tableCellCenter]}>
              {item.cantidad}
            </Text>
          </View>
          <View style={{ flex: 1.2 }}>
            <Text style={[styles.tableCell, styles.tableCellRight]}>
              {formatters.money(item.precioUnit)}
            </Text>
          </View>
          <View style={{ flex: 1.2 }}>
            <Text style={[styles.tableCell, styles.tableCellRight, styles.tableCellTotal]}>
              {formatters.money(item.total)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

interface SummaryProps {
  subtotal: number;
  descuento?: number | null;
  impuesto: number;
  total: number;
  moneda?: string;
}

const Summary: React.FC<SummaryProps> = ({
  subtotal,
  descuento,
  impuesto,
  total,
  moneda = 'CLP',
}) => (
  <View style={styles.summaryContainer}>
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>Subtotal</Text>
      <Text style={styles.summaryValue}>{formatters.money(subtotal, moneda)}</Text>
    </View>

    {descuento && descuento > 0 && (
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Descuento</Text>
        <Text style={styles.summaryValue}>-{formatters.money(descuento, moneda)}</Text>
      </View>
    )}

    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>IVA (19%)</Text>
      <Text style={styles.summaryValue}>{formatters.money(impuesto, moneda)}</Text>
    </View>

    <View style={styles.summaryRowFinal}>
      <Text style={styles.summaryLabel}>TOTAL</Text>
      <Text style={styles.summaryTotal}>{formatters.money(total, moneda)}</Text>
    </View>
  </View>
);

interface TermsProps {
  modoEnvio?: string | null;
  fechaEntrega?: string | null;
  formaPago?: string | null;
  duracionValidezDias?: number | null;
}

const Terms: React.FC<TermsProps> = ({
  modoEnvio,
  fechaEntrega,
  formaPago,
  duracionValidezDias,
}) => (
  <View style={styles.termsContainer}>
    <Text style={styles.termsTitle}>Términos y Condiciones</Text>
    <View style={styles.termsList}>
      <View style={styles.termsItem}>
        <Text style={styles.termsBullet}>•</Text>
        <Text>Envío: {modoEnvio || 'Entrega en oficina del cliente'}</Text>
      </View>
      <View style={styles.termsItem}>
        <Text style={styles.termsBullet}>•</Text>
        <Text>Entrega: {fechaEntrega || '24 hrs después del pago'}</Text>
      </View>
      <View style={styles.termsItem}>
        <Text style={styles.termsBullet}>•</Text>
        <Text>Forma de pago: {formaPago || 'Transferencia'}</Text>
      </View>
      <View style={styles.termsItem}>
        <Text style={styles.termsBullet}>•</Text>
        <Text>
          Validez:{' '}
          {duracionValidezDias
            ? `${duracionValidezDias} días`
            : '48 horas'}
        </Text>
      </View>
    </View>
  </View>
);

const PaymentInfo: React.FC = () => (
  <View style={styles.paymentContainer}>
    <Text style={styles.paymentTitle}>Datos de Pago</Text>
    <Text style={styles.paymentInfo}>
      <Text style={styles.paymentLabel}>Banco:</Text> Santander
    </Text>
    <Text style={styles.paymentInfo}>
      <Text style={styles.paymentLabel}>Cuenta Corriente:</Text> 0-000-8814903-3
    </Text>
    <Text style={styles.paymentInfo}>
      <Text style={styles.paymentLabel}>Titular:</Text> Servicios Informáticos Marcelo Cortés EIRL
    </Text>
    <Text style={styles.paymentInfo}>
      <Text style={styles.paymentLabel}>RUT:</Text> 76.732.709-9
    </Text>
    <Text style={styles.paymentInfo}>
      <Text style={styles.paymentLabel}>Email:</Text> contacto@itsdev.cl
    </Text>
  </View>
);

const Signature: React.FC = () => (
  <View style={styles.signatureContainer}>
    <View style={styles.signatureLine} />
    <Text style={styles.signatureLabel}>Firma Autorizado</Text>
  </View>
);

interface FooterProps {
  fechaGeneracion: Date;
}

const Footer: React.FC<FooterProps> = ({ fechaGeneracion }) => (
  <View style={styles.footerContainer}>
    <View style={styles.footerContact}>
      <Text>+56 9 9095 8220</Text>
      <Text>contacto@itsdev.cl</Text>
      <Text>Santiago, Chile</Text>
    </View>
    <Text style={styles.footerDate}>
      Generado: {new Date(fechaGeneracion).toLocaleString('es-CL')}
    </Text>
  </View>
);

// ============================================
// DOCUMENTO PRINCIPAL
// ============================================

export default function CotizacionPDFDocument({
  numero,
  fecha,
  validez,
  cliente,
  nombreProspecto,
  emailProspecto,
  etiquetaComercial,
  oportunidad,
  items,
  subtotal,
  descuento,
  impuesto,
  total,
  moneda = 'CLP',
  modoEnvio,
  fechaEntrega,
  formaPago,
  duracionValidezDias,
  notas,
  logoBase64,
}: CotizacionPDFProps) {
  return (
    <Document>
      {/* PÁGINA 1: COTIZACIÓN PRINCIPAL */}
      <Page size="A4" style={[styles.page, { paddingBottom: 40 }]}>
        <Header fecha={fecha} logoBase64={logoBase64} />
        <ClientInfo
          cliente={cliente}
          nombreProspecto={nombreProspecto}
          emailProspecto={emailProspecto}
          numero={numero}
          fecha={fecha}
          validez={validez}
          etiquetaComercial={etiquetaComercial}
          oportunidad={oportunidad}
        />
        <View style={styles.divider} />
        <ItemsTable items={items} />
        <Summary
          subtotal={subtotal}
          descuento={descuento}
          impuesto={impuesto}
          total={total}
          moneda={moneda}
        />
        <Terms
          modoEnvio={modoEnvio}
          fechaEntrega={fechaEntrega}
          formaPago={formaPago}
          duracionValidezDias={duracionValidezDias}
        />
        <PaymentInfo />
        <Signature />
        <Footer fechaGeneracion={new Date()} />
      </Page>

      {/* PÁGINA 2: NOTAS Y TÉRMINOS ADICIONALES (si hay) */}
      {notas && (
        <Page size="A4" style={[styles.page, { paddingBottom: 40 }]}>
          <Header fecha={fecha} logoBase64={logoBase64} />
          <View style={[styles.termsContainer, { marginTop: 20 }]}>
            <Text style={styles.termsTitle}>Notas y Términos Adicionales</Text>
            <Text style={{ fontSize: 10, color: COLORS.dark, lineHeight: 1.6 }}>
              {notas}
            </Text>
          </View>
          <Footer fechaGeneracion={new Date()} />
        </Page>
      )}
    </Document>
  );
}
