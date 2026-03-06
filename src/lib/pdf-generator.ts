import jsPDF from 'jspdf';
import fs from 'fs';
import path from 'path';

interface FacturaData {
    numero: string;
    fechaEmision: string;
    fechaVenc: string;
    cliente: {
        razonSocial: string;
        rut?: string;
        email?: string;
    };
    items: Array<{
        descripcion: string;
        cantidad: number;
        precioUnit: number;
        total: number;
    }>;
    subtotal: number;
    impuesto: number;
    total: number;
    notas?: string;
}

interface CotizacionData {
    numero: string;
    fecha: string;
    validez: string;
    cliente?: {
        razonSocial: string;
        rut?: string;
        email?: string;
        contacto?: string;
    };
    nombreProspecto?: string;
    emailProspecto?: string;
    items: Array<{
        sku?: string;
        descripcion: string;
        cantidad: number;
        precioUnit: number;
        total: number;
    }>;
    subtotal: number;
    descuento?: number;
    impuesto: number;
    total: number;
    notas?: string;
    modoEnvio?: string;
    fechaEntrega?: string;
    formaPago?: string;
    duracionValidezDias?: number;
}

// Load logo as base64 (prefer transparent variants for PDF)
let LOGO_BASE64 = '';
try {
    const candidates = [
        path.join(process.cwd(), 'public', 'logo-transparent.png'),
        path.join(process.cwd(), 'public', 'logo-dark.png'),
        path.join(process.cwd(), 'public', 'logo-pdf.png')
    ];
    const selected = candidates.find((candidate) => fs.existsSync(candidate));
    if (selected) {
        const logoBuffer = fs.readFileSync(selected);
        LOGO_BASE64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    }
} catch {
    console.warn('Logo not found, will use text fallback');
}

export function generateFacturaPDF(data: FacturaData): Buffer {
    const doc = new jsPDF();

    // Colors
    const darkBlue: [number, number, number] = [44, 62, 80];
    const green: [number, number, number] = [139, 195, 74];
    const lightGray: [number, number, number] = [245, 245, 245];
    const textDark: [number, number, number] = [40, 40, 40];
    const textGray: [number, number, number] = [100, 100, 100];

    // ============================================
    // HEADER - Dark blue background (45mm height)
    // ============================================
    doc.setFillColor(...darkBlue);
    doc.rect(0, 0, 210, 45, 'F');

    // Green triangle stripe on the right
    doc.setFillColor(...green);
    doc.triangle(150, 0, 210, 0, 210, 45, 'F');

    // Logo box with white background and shadow effect
    doc.setFillColor(200, 200, 200);
    doc.roundedRect(13, 9, 62, 28, 3, 3, 'F'); // Shadow
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(12, 8, 62, 28, 3, 3, 'F');

    // Logo or text
    if (LOGO_BASE64) {
        try {
            doc.addImage(LOGO_BASE64, 'PNG', 14, 10, 58, 24);
        } catch {
            drawLogoTextFactura(doc);
        }
    } else {
        drawLogoTextFactura(doc);
    }

    // Document info (right side in header)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Factura N°:', 120, 28);
    doc.setFont('helvetica', 'bold');
    doc.text(data.numero, 195, 28, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.text('Fecha:', 120, 35);
    doc.setFont('helvetica', 'bold');
    doc.text(new Date(data.fechaEmision).toLocaleDateString('es-CL'), 195, 35, { align: 'right' });

    // ============================================
    // DOCUMENT TITLE - Below header
    // ============================================
    doc.setTextColor(...darkBlue);
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURA', 195, 58, { align: 'right' });

    // ============================================
    // INFO SECTION - Para / De
    // ============================================
    const infoY = 70;
    
    // "Factura Para:" section
    doc.setTextColor(...green);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Factura Para:', 15, infoY);
    
    doc.setTextColor(...textDark);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(data.cliente.razonSocial, 15, infoY + 7);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`RUT: ${data.cliente.rut || 'N/A'}`, 15, infoY + 13);
    doc.text(`Email: ${data.cliente.email || 'N/A'}`, 15, infoY + 18);

    // "Factura De:" section
    doc.setTextColor(...green);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Factura De:', 120, infoY);
    
    doc.setTextColor(...textDark);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ITSDev SpA', 120, infoY + 7);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('RUT: 76.732.709-9', 120, infoY + 13);
    doc.text('Email: contacto@itsdev.cl', 120, infoY + 18);

    // ============================================
    // ITEMS TABLE
    // ============================================
    let yPos = 100;

    // Table header
    doc.setFillColor(...green);
    doc.rect(15, yPos, 18, 10, 'F');
    
    doc.setFillColor(...darkBlue);
    doc.rect(33, yPos, 87, 10, 'F');
    doc.rect(120, yPos, 28, 10, 'F');
    doc.rect(148, yPos, 22, 10, 'F');
    doc.rect(170, yPos, 25, 10, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('N°', 24, yPos + 7, { align: 'center' });
    doc.text('DESCRIPCIÓN', 76.5, yPos + 7, { align: 'center' });
    doc.text('PRECIO', 134, yPos + 7, { align: 'center' });
    doc.text('CANT.', 159, yPos + 7, { align: 'center' });
    doc.text('TOTAL', 182.5, yPos + 7, { align: 'center' });

    // Table rows
    yPos += 10;
    
    data.items.forEach((item, index) => {
        // Check for page break
        if (yPos > 230) {
            doc.addPage();
            yPos = 20;
        }

        // Alternating row background
        if (index % 2 === 0) {
            doc.setFillColor(...lightGray);
            doc.rect(15, yPos, 180, 12, 'F');
        }

        doc.setTextColor(60, 60, 60);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        // Row number
        doc.text(String(index + 1).padStart(2, '0'), 24, yPos + 8, { align: 'center' });
        
        // Description (with text wrapping)
        const descLines = doc.splitTextToSize(item.descripcion, 80);
        doc.text(descLines[0], 35, yPos + 8);
        
        // Price
        doc.text(`$${item.precioUnit.toLocaleString('es-CL')}`, 134, yPos + 8, { align: 'center' });
        
        // Quantity
        doc.text(String(item.cantidad), 159, yPos + 8, { align: 'center' });
        
        // Total (bold)
        doc.setFont('helvetica', 'bold');
        doc.text(`$${item.total.toLocaleString('es-CL')}`, 182.5, yPos + 8, { align: 'center' });

        yPos += 12;
    });

    // ============================================
    // TOTALS SECTION (right aligned)
    // ============================================
    yPos += 8;
    const totalsX = 145;
    
    doc.setFontSize(10);
    doc.setTextColor(...textGray);
    doc.setFont('helvetica', 'normal');
    
    doc.text('Subtotal:', totalsX, yPos);
    doc.text(`$${data.subtotal.toLocaleString('es-CL')}`, 192, yPos, { align: 'right' });
    yPos += 6;
    
    doc.text('IVA (19%):', totalsX, yPos);
    doc.text(`$${data.impuesto.toLocaleString('es-CL')}`, 192, yPos, { align: 'right' });
    yPos += 8;
    
    // Total box with green background
    doc.setFillColor(...green);
    doc.roundedRect(totalsX - 5, yPos - 4, 55, 12, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', totalsX, yPos + 4);
    doc.setFontSize(13);
    doc.text(`$${data.total.toLocaleString('es-CL')}`, 192, yPos + 4, { align: 'right' });

    // ============================================
    // NOTES SECTION (with left green border)
    // ============================================
    if (data.notas) {
        yPos += 20;
        
        // Calculate notes height
        const notesLines = doc.splitTextToSize(data.notas, 165);
        const notesHeight = Math.max(25, notesLines.length * 5 + 15);
        
        // Background box
        doc.setFillColor(250, 250, 250);
        doc.rect(15, yPos - 3, 180, notesHeight, 'F');
        
        // Left green border
        doc.setFillColor(...green);
        doc.rect(15, yPos - 3, 3, notesHeight, 'F');
        
        doc.setTextColor(...green);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Términos y Condiciones:', 22, yPos + 3);
        
        doc.setTextColor(80, 80, 80);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(notesLines, 22, yPos + 10);
    }

    // ============================================
    // FOOTER
    // ============================================
    doc.setFillColor(...darkBlue);
    doc.rect(0, 272, 210, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('+56 9 9095 8220', 25, 285);
    doc.text('contacto@itsdev.cl', 85, 285);
    doc.text('Santiago, Chile', 155, 285);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Gracias por su preferencia', 195, 280, { align: 'right' });

    return Buffer.from(doc.output('arraybuffer'));
}

// Helper function for logo text fallback (Factura)
function drawLogoTextFactura(doc: jsPDF) {
    doc.setTextColor(44, 62, 80);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('ITSDev', 20, 22);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(102, 102, 102);
    doc.text('Soluciones Tecnológicas', 20, 28);
}

export function generateCotizacionPDF(data: CotizacionData): Buffer {
    const doc = new jsPDF();

    const palette = {
        navy: [24, 39, 58] as [number, number, number],
        green: [133, 186, 57] as [number, number, number],
        line: [225, 232, 240] as [number, number, number],
        text: [15, 23, 42] as [number, number, number],
        muted: [71, 85, 105] as [number, number, number],
        soft: [248, 250, 252] as [number, number, number],
        panel: [246, 248, 251] as [number, number, number],
        white: [255, 255, 255] as [number, number, number]
    };

    const formatMoney = (value: number) => `$${value.toLocaleString('es-CL')}`;
    const formatDate = (value: string) => new Date(value).toLocaleDateString('es-CL');
    const clientName = data.cliente?.razonSocial || data.nombreProspecto || 'Prospecto';
    const clientEmail = data.cliente?.email || data.emailProspecto || 'N/A';
    const clientContacto = data.cliente?.contacto || 'N/A';

    doc.setFillColor(...palette.navy);
    doc.rect(0, 0, 210, 34, 'F');
    doc.setFillColor(...palette.green);
    doc.rect(0, 0, 210, 4, 'F');
    doc.setFillColor(...palette.green);
    doc.triangle(162, 34, 210, 34, 210, 22, 'F');

    if (LOGO_BASE64) {
        try {
            doc.addImage(LOGO_BASE64, 'PNG', 14, 8, 58, 16);
        } catch {
            drawLogoTextCotizacion(doc, 14, 17);
        }
    } else {
        drawLogoTextCotizacion(doc, 14, 17);
    }

    doc.setTextColor(...palette.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('COTIZACIÓN', 194, 16, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('ITSDev (IT Specialists)', 194, 23, { align: 'right' });

    doc.setTextColor(...palette.text);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('Cotización', 14, 48);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...palette.muted);
    doc.setFontSize(9);
    doc.text('Detalle de productos y condiciones comerciales', 14, 53);

    const cardY = 60;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...palette.green);
    doc.text('CLIENTE', 14, cardY + 2);

    doc.setTextColor(...palette.text);
    doc.setFontSize(10.5);
    doc.text(clientName, 14, cardY + 8);
    doc.text(`Cotización Nro: ${data.numero}`, 110, cardY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Contacto: ${clientContacto}`, 14, cardY + 12.5);
    doc.text(`Email: ${clientEmail}`, 14, cardY + 16.5);
    doc.text(`RUT: ${data.cliente?.rut || '-'}`, 14, cardY + 20.5);
    doc.text(`Fecha: ${formatDate(data.fecha)}`, 110, cardY + 12.5);
    doc.text(`Validez: ${formatDate(data.validez)}`, 110, cardY + 16.5);
    doc.setDrawColor(...palette.line);
    doc.line(14, cardY + 24, 196, cardY + 24);

    let yPos = 92;
    const hasSku = data.items.some((i) => i.sku && i.sku.trim() !== '');
    const cols = hasSku
        ? { idx: 12, sku: 19, desc: 73, qty: 18, unit: 30, total: 30 }
        : { idx: 12, sku: 0, desc: 92, qty: 18, unit: 30, total: 30 };
    const tableW = cols.idx + cols.sku + cols.desc + cols.qty + cols.unit + cols.total;
    const tableRight = 14 + tableW;

    const drawHeader = (y: number) => {
        let x = 14;
        doc.setFillColor(...palette.navy);
        doc.rect(x, y, tableW, 9, 'F');
        doc.setTextColor(...palette.white);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.2);
        doc.text('N', x + cols.idx / 2, y + 6, { align: 'center' });
        x += cols.idx;
        if (hasSku) {
            doc.text('SKU', x + cols.sku / 2, y + 6, { align: 'center' });
            x += cols.sku;
        }
        doc.text('DESCRIPCIÓN', x + cols.desc / 2, y + 6, { align: 'center' });
        x += cols.desc;
        doc.text('CANT.', x + cols.qty / 2, y + 6, { align: 'center' });
        x += cols.qty;
        doc.text('P. UNIT', x + cols.unit / 2, y + 6, { align: 'center' });
        x += cols.unit;
        doc.text('TOTAL', x + cols.total / 2, y + 6, { align: 'center' });
    };

    drawHeader(yPos);
    yPos += 9;

    data.items.forEach((item, index) => {
        const descLines = doc.splitTextToSize(item.descripcion, cols.desc - 4);
        const rowH = Math.max(10, 4 + descLines.length * 4.2);
        if (yPos + rowH > 232) {
            doc.addPage();
            yPos = 18;
            drawHeader(yPos);
            yPos += 9;
        }

        let x = 14;
        doc.setTextColor(...palette.text);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(String(index + 1).padStart(2, '0'), x + cols.idx / 2, yPos + 6, { align: 'center' });
        x += cols.idx;

        if (hasSku) {
            doc.text((item.sku || '-').slice(0, 12), x + cols.sku / 2, yPos + 6, { align: 'center' });
            x += cols.sku;
        }

        doc.text(descLines, x + 2, yPos + 5.7);
        x += cols.desc;
        doc.text(String(item.cantidad), x + cols.qty / 2, yPos + 6, { align: 'center' });
        x += cols.qty;
        doc.text(formatMoney(item.precioUnit), x + cols.unit - 2, yPos + 6, { align: 'right' });
        x += cols.unit;
        doc.setFont('helvetica', 'bold');
        doc.text(formatMoney(item.total), x + cols.total - 2, yPos + 6, { align: 'right' });

        doc.setDrawColor(...palette.line);
        doc.line(14, yPos + rowH, tableRight, yPos + rowH);
        yPos += rowH;
    });

    yPos += 4;
    const summaryRows = [
        { label: 'Subtotal', value: formatMoney(data.subtotal), isTotal: false },
        ...(data.descuento && data.descuento > 0
            ? [{ label: 'Descuento', value: `-${formatMoney(data.descuento)}`, isTotal: false }]
            : []),
        { label: 'IVA (19%)', value: formatMoney(data.impuesto), isTotal: false },
        { label: 'TOTAL', value: formatMoney(data.total), isTotal: true }
    ];

    const summaryLabelX = tableRight - cols.total - 6;
    summaryRows.forEach((row) => {
        const rowH = row.isTotal ? 9 : 7;
        if (yPos + rowH > 232) {
            doc.addPage();
            yPos = 20;
        }

        if (row.isTotal) {
            doc.setFillColor(...palette.green);
            doc.rect(14, yPos, tableW, rowH, 'F');
            doc.setTextColor(...palette.white);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text(row.label, summaryLabelX, yPos + 6, { align: 'right' });
            doc.text(row.value, tableRight - 2, yPos + 6, { align: 'right' });
        } else {
            doc.setTextColor(...palette.text);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text(row.label, summaryLabelX, yPos + 4.8, { align: 'right' });
            doc.text(row.value, tableRight - 2, yPos + 4.8, { align: 'right' });
            doc.setDrawColor(...palette.line);
            doc.line(14, yPos + rowH, tableRight, yPos + rowH);
        }

        yPos += rowH;
    });

    yPos += 8;
    if (yPos > 220) {
        doc.addPage();
        yPos = 18;
    }

    yPos = Math.max(yPos, 230);
    doc.setDrawColor(...palette.line);
    doc.line(14, yPos, 102, yPos);
    doc.line(108, yPos, 196, yPos);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...palette.green);
    doc.text('CONDICIONES', 14, yPos + 6);
    doc.text('DATOS DE PAGO', 108, yPos + 6);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...palette.text);
    doc.setFontSize(8);
    const terms = [
        `- Modo de envío: ${data.modoEnvio || 'Entrega en oficina del cliente'}`,
        `- Fecha de entrega: ${data.fechaEntrega || '24 hrs después del pago'}`,
        `- Forma de pago: ${data.formaPago || 'Transferencia'}`,
        `- Validez: ${data.duracionValidezDias ? `${data.duracionValidezDias * 24} horas` : '48 horas'}`
    ];
    terms.forEach((line, index) => doc.text(line, 14, yPos + 11.5 + index * 5.8));

    if (data.notas) {
        doc.setTextColor(...palette.muted);
        doc.setFont('helvetica', 'italic');
        doc.text(doc.splitTextToSize(`Nota: ${data.notas}`, 82).slice(0, 2), 18, yPos + 37);
    }

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...palette.text);
    doc.text('Banco Santander', 108, yPos + 11.5);
    doc.text('Cuenta Corriente: 0-000-8814903-3', 108, yPos + 17.3);
    doc.text('Titular: Servicios Informáticos Marcelo Cortés EIRL', 108, yPos + 23.1);
    doc.text('RUT: 76.732.709-9', 108, yPos + 28.9);
    doc.text('Email: contacto@itsdev.cl', 108, yPos + 34.7);

    doc.setFillColor(...palette.navy);
    doc.rect(0, 274, 210, 23, 'F');
    doc.setTextColor(...palette.white);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('+56 9 9095 8220   contacto@itsdev.cl   Santiago, Chile', 14, 287);
    doc.text(`Generado: ${new Date().toLocaleString('es-CL')}`, 195, 287, { align: 'right' });

    return Buffer.from(doc.output('arraybuffer'));
}

function drawLogoTextCotizacion(doc: jsPDF, x: number, y: number) {
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('ITSDev', x, y);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text('Soluciones tecnológicas', x, y + 4.5);
}
