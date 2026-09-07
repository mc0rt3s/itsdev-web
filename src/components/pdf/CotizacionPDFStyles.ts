import { StyleSheet } from '@react-pdf/renderer';

// Paleta de colores corporativa
export const COLORS = {
  navy: '#182736',
  green: '#85ba39',
  slate: '#64748b',
  soft: '#f8fafc',
  white: '#ffffff',
  dark: '#0f172a',
  lightGray: '#e2e8f0',
  borderLight: '#cbd5e1',
} as const;

export const styles = StyleSheet.create({
  // === PÁGINA ===
  page: {
    padding: 0,
    fontSize: 11,
    fontFamily: 'Helvetica',
    backgroundColor: COLORS.white,
  },

  // === HEADER ===
  headerContainer: {
    backgroundColor: COLORS.navy,
    padding: '15px 20px',
    marginBottom: 20,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerLeft: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  logo: {
    width: 50,
    height: 20,
  },

  headerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },

  headerSubtitle: {
    color: COLORS.white,
    fontSize: 8,
    marginTop: 2,
  },

  headerDate: {
    color: COLORS.white,
    fontSize: 9,
    textAlign: 'right',
  },

  // === CLIENTE INFO ===
  clientInfoContainer: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 20,
    paddingHorizontal: 20,
    gap: 30,
  },

  clientColumn: {
    flex: 1,
  },

  infoLabel: {
    color: COLORS.green,
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  infoField: {
    marginBottom: 8,
  },

  infoFieldLabel: {
    color: COLORS.slate,
    fontSize: 8,
    marginBottom: 2,
  },

  infoFieldValue: {
    color: COLORS.dark,
    fontSize: 10,
    fontWeight: '500',
  },

  divider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    marginHorizontal: 20,
    marginVertical: 15,
  },

  // === TABLA ITEMS ===
  tableContainer: {
    marginHorizontal: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },

  tableHeader: {
    backgroundColor: COLORS.navy,
    display: 'flex',
    flexDirection: 'row',
    padding: '8px 0',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },

  tableHeaderCell: {
    color: COLORS.white,
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 6,
  },

  tableRow: {
    display: 'flex',
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.soft,
  },

  tableRowLast: {
    borderBottomWidth: 0,
  },

  tableCell: {
    fontSize: 9,
    color: COLORS.dark,
    paddingHorizontal: 6,
    textAlign: 'left',
  },

  tableCellCenter: {
    textAlign: 'center',
  },

  tableCellRight: {
    textAlign: 'right',
  },

  tableCellNumber: {
    fontWeight: 'bold',
    color: COLORS.dark,
  },

  tableCellTotal: {
    fontWeight: 'bold',
    color: COLORS.green,
  },

  // === RESUMEN FINANCIERO ===
  summaryContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    maxWidth: '40%',
  },

  summaryRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },

  summaryRowFinal: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.green,
    marginBottom: 8,
    paddingBottom: 8,
  },

  summaryLabel: {
    fontSize: 9,
    color: COLORS.slate,
    fontWeight: '500',
    marginRight: 15,
  },

  summaryValue: {
    fontSize: 9,
    color: COLORS.dark,
    fontWeight: 'bold',
    minWidth: 70,
    textAlign: 'right',
  },

  summaryTotal: {
    fontSize: 12,
    color: COLORS.green,
    fontWeight: 'bold',
    minWidth: 70,
    textAlign: 'right',
  },

  // === TÉRMINOS Y CONDICIONES ===
  termsContainer: {
    marginHorizontal: 20,
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },

  termsTitle: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  termsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },

  termsItem: {
    display: 'flex',
    flexDirection: 'row',
    fontSize: 8,
    color: COLORS.dark,
    marginBottom: 4,
  },

  termsBullet: {
    marginRight: 6,
  },

  // === DATOS DE PAGO ===
  paymentContainer: {
    marginHorizontal: 20,
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },

  paymentTitle: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  paymentInfo: {
    fontSize: 9,
    color: COLORS.dark,
    lineHeight: 1.4,
    marginBottom: 4,
  },

  paymentLabel: {
    fontWeight: 'bold',
  },

  // === FIRMA ===
  signatureContainer: {
    marginHorizontal: 20,
    marginTop: 15,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },

  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: COLORS.dark,
    width: 120,
    marginBottom: 4,
  },

  signatureLabel: {
    fontSize: 8,
    color: COLORS.slate,
    textAlign: 'center',
    width: 120,
  },

  // === FOOTER ===
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.navy,
    color: COLORS.white,
    paddingVertical: 8,
    paddingHorizontal: 20,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 8,
    height: 30,
    borderTopWidth: 1,
    borderTopColor: COLORS.green,
  },

  footerContact: {
    display: 'flex',
    flexDirection: 'row',
    gap: 15,
  },

  footerDate: {
    textAlign: 'right',
  },

  // === LAYOUT UTILITIES ===
  spacer: {
    height: 10,
  },

  pageBreak: {
    pageBreakAfter: 'always',
  },

  flexRow: {
    display: 'flex',
    flexDirection: 'row',
  },

  flexColumn: {
    display: 'flex',
    flexDirection: 'column',
  },

  justifyBetween: {
    justifyContent: 'space-between',
  },

  gap10: {
    gap: 10,
  },
});

// Utilidades de formato
export const formatters = {
  money: (value: number, currency = 'CLP'): string => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  },

  date: (dateString: string | Date): string => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return new Intl.DateTimeFormat('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  },

  shortDate: (dateString: string | Date): string => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return new Intl.DateTimeFormat('es-CL', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  },

  rut: (rut: string): string => {
    if (!rut) return '-';
    const parts = rut.split('-');
    if (parts.length === 2) {
      return `${parseInt(parts[0]).toLocaleString('es-CL')}-${parts[1]}`;
    }
    return rut;
  },
};
