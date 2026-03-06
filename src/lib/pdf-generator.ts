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

// Load logo as base64
let LOGO_BASE64 = '';
try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    const logoBuffer = fs.readFileSync(logoPath);
    LOGO_BASE64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
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
        emerald: [42, 157, 143] as [number, number, number],
        slate100: [241, 245, 249] as [number, number, number],
        slate200: [226, 232, 240] as [number, number, number],
        slate500: [100, 116, 139] as [number, number, number],
        slate700: [51, 65, 85] as [number, number, number],
        text: [30, 41, 59] as [number, number, number],
        white: [255, 255, 255] as [number, number, number],
    };

    const formatMoney = (value: number) => `$ ${value.toLocaleString('es-CL')}`;
    const formatDate = (value: string) => new Date(value).toLocaleDateString('es-CL');
    const pageBottom = 274;

    // Header band
    doc.setFillColor(...palette.navy);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setFillColor(...palette.emerald);
    doc.rect(0, 40, 210, 2.5, 'F');

    // Logo card
    doc.setFillColor(...palette.white);
    doc.roundedRect(14, 8, 56, 24, 3, 3, 'F');
    if (LOGO_BASE64) {
        try {
            doc.addImage(LOGO_BASE64, 'PNG', 18, 12, 48, 16);
        } catch {
            drawLogoText(doc);
        }
    } else {
        drawLogoText(doc);
    }

    // Header right metadata
    doc.setTextColor(...palette.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('COTIZACIÓN', 195, 14, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`N° ${data.numero}`, 195, 20, { align: 'right' });
    doc.text(`Emitida: ${formatDate(data.fecha)}`, 195, 25, { align: 'right' });
    doc.text(`Válida hasta: ${formatDate(data.validez)}`, 195, 30, { align: 'right' });

    // Title block
    doc.setTextColor(...palette.text);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('Propuesta Comercial', 14, 54);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...palette.slate500);
    doc.setFontSize(10);
    doc.text('Desarrollo y servicios tecnológicos para tu operación', 14, 60);

    // Client & provider cards
    const cardY = 66;
    doc.setFillColor(...palette.slate100);
    doc.setDrawColor(...palette.slate200);
    doc.roundedRect(14, cardY, 88, 28, 2, 2, 'FD');
    doc.roundedRect(108, cardY, 88, 28, 2, 2, 'FD');

    doc.setTextColor(...palette.emerald);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('CLIENTE', 18, cardY + 6);
    doc.text('PROVEEDOR', 112, cardY + 6);

    doc.setTextColor(...palette.text);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    const clientName = data.cliente?.razonSocial || data.nombreProspecto || 'Prospecto';
    doc.text(clientName, 18, cardY + 12);
    doc.text('ITSDev SpA', 112, cardY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Email: ${data.cliente?.email || data.emailProspecto || 'N/A'}`, 18, cardY + 18);
    doc.text(`RUT: ${data.cliente?.rut || '-'}`, 18, cardY + 23);
    doc.text('RUT: 76.732.709-9', 112, cardY + 18);
    doc.text('contacto@itsdev.cl', 112, cardY + 23);

    // Items table
    let yPos = 102;
    const hasSku = data.items.some((i) => i.sku && i.sku.trim() !== '');
    const cols = hasSku
        ? { qty: 18, sku: 22, desc: 74, unit: 32, total: 32 }
        : { qty: 18, sku: 0, desc: 96, unit: 32, total: 32 };
    const tableW = cols.qty + cols.sku + cols.desc + cols.unit + cols.total;

    const drawTableHeader = (y: number) => {
        let x = 14;
        doc.setFillColor(...palette.navy);
        doc.rect(x, y, tableW, 9, 'F');
        doc.setTextColor(...palette.white);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text('CANT.', x + cols.qty / 2, y + 6, { align: 'center' });
        x += cols.qty;
        if (hasSku) {
            doc.text('SKU', x + cols.sku / 2, y + 6, { align: 'center' });
            x += cols.sku;
        }
        doc.text('DESCRIPCIÓN', x + cols.desc / 2, y + 6, { align: 'center' });
        x += cols.desc;
        doc.text('P. UNITARIO', x + cols.unit / 2, y + 6, { align: 'center' });
        x += cols.unit;
        doc.text('TOTAL', x + cols.total / 2, y + 6, { align: 'center' });
    };

    drawTableHeader(yPos);
    yPos += 9;

    data.items.forEach((item, index) => {
        const descLines = doc.splitTextToSize(item.descripcion, cols.desc - 5);
        const rowHeight = Math.max(10, 4 + descLines.length * 4.2);

        if (yPos + rowHeight > 236) {
            doc.addPage();
            yPos = 18;
            drawTableHeader(yPos);
            yPos += 9;
        }

        if (index % 2 === 0) {
            doc.setFillColor(...palette.slate100);
            doc.rect(14, yPos, tableW, rowHeight, 'F');
        }

        let x = 14;
        doc.setTextColor(...palette.slate700);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.text(String(item.cantidad), x + cols.qty / 2, yPos + 6, { align: 'center' });
        x += cols.qty;

        if (hasSku) {
            doc.text((item.sku || '-').slice(0, 12), x + cols.sku / 2, yPos + 6, { align: 'center' });
            x += cols.sku;
        }

        doc.text(descLines, x + 2, yPos + 5.8);
        x += cols.desc;

        doc.text(formatMoney(item.precioUnit), x + cols.unit / 2, yPos + 6, { align: 'center' });
        x += cols.unit;

        doc.setFont('helvetica', 'bold');
        doc.text(formatMoney(item.total), x + cols.total / 2, yPos + 6, { align: 'center' });
        yPos += rowHeight;
    });

    // Totals card
    yPos += 8;
    if (yPos > 214) {
        doc.addPage();
        yPos = 18;
    }

    const totalsX = 124;
    doc.setFillColor(...palette.slate100);
    doc.setDrawColor(...palette.slate200);
    doc.roundedRect(totalsX, yPos, 72, 30, 2, 2, 'FD');

    let ty = yPos + 7;
    doc.setTextColor(...palette.slate700);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Subtotal', totalsX + 4, ty);
    doc.text(formatMoney(data.subtotal), 192, ty, { align: 'right' });
    ty += 6;

    if (data.descuento && data.descuento > 0) {
        doc.text('Descuento', totalsX + 4, ty);
        doc.text(`- ${formatMoney(data.descuento)}`, 192, ty, { align: 'right' });
        ty += 6;
    }

    doc.text('IVA (19%)', totalsX + 4, ty);
    doc.text(formatMoney(data.impuesto), 192, ty, { align: 'right' });
    ty += 7;

    doc.setDrawColor(...palette.emerald);
    doc.line(totalsX + 4, ty - 3, 192, ty - 3);
    doc.setTextColor(...palette.navy);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TOTAL', totalsX + 4, ty + 1);
    doc.text(formatMoney(data.total), 192, ty + 1, { align: 'right' });

    // Terms + payment blocks
    yPos += 38;
    if (yPos > 228) {
        doc.addPage();
        yPos = 18;
    }

    const termsH = 42;
    doc.setFillColor(...palette.slate100);
    doc.setDrawColor(...palette.slate200);
    doc.roundedRect(14, yPos, 88, termsH, 2, 2, 'FD');
    doc.roundedRect(108, yPos, 88, termsH, 2, 2, 'FD');

    doc.setTextColor(...palette.emerald);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Términos', 18, yPos + 7);
    doc.text('Datos de Pago', 112, yPos + 7);

    doc.setTextColor(...palette.slate700);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const termsLines = [
        `• Modo de envío: ${data.modoEnvio || 'Entrega en oficina de cliente'}`,
        `• Fecha de entrega: ${data.fechaEntrega || '24 hrs tras confirmación de pago'}`,
        `• Forma de pago: ${data.formaPago || 'Transferencia'}`,
        `• Validez: ${data.duracionValidezDias ? `${data.duracionValidezDias} días` : '14 días'}`,
    ];
    termsLines.forEach((line, idx) => doc.text(line, 18, yPos + 13 + idx * 6));

    if (data.notas) {
        const note = doc.splitTextToSize(`Nota: ${data.notas}`, 82);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(...palette.slate500);
        doc.text(note.slice(0, 2), 18, yPos + 37);
    }

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...palette.slate700);
    doc.text('Banco Santander', 112, yPos + 13);
    doc.text('Cuenta Corriente: 0-000-8814903-3', 112, yPos + 19);
    doc.text('Titular: Servicios Informáticos M. Cortés EIRL', 112, yPos + 25);
    doc.text('RUT: 76.732.709-9', 112, yPos + 31);
    doc.text('Email: contacto@itsdev.cl', 112, yPos + 37);

    // Footer
    doc.setFillColor(...palette.navy);
    doc.rect(0, pageBottom, 210, 23, 'F');
    doc.setTextColor(...palette.white);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('ITSDev · Soluciones tecnológicas modernas para empresas', 14, pageBottom + 8);
    doc.text('+56 9 9095 8220 · contacto@itsdev.cl · Santiago, Chile', 14, pageBottom + 14);
    doc.text(`Documento generado el ${new Date().toLocaleString('es-CL')}`, 196, pageBottom + 14, { align: 'right' });

    return Buffer.from(doc.output('arraybuffer'));
}

// Helper function for logo text fallback
function drawLogoText(doc: jsPDF) {
    // "its" in gray, "Dev" in green
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text('its', 18, 21);
    doc.setTextColor(139, 195, 74); // Green
    doc.text('Dev', 32, 21);
    
    // Subtitle
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text('Soluciones Informáticas', 18, 27);
}
