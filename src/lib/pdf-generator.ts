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

// Load logo as base64
let LOGO_BASE64 = '';
try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    const logoBuffer = fs.readFileSync(logoPath);
    LOGO_BASE64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
} catch (error) {
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
    doc.roundedRect(13, 9, 55, 26, 3, 3, 'F'); // Shadow
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(12, 8, 55, 26, 3, 3, 'F');

    // Logo image
    if (LOGO_BASE64) {
        try {
            // Adjusted dimensions to fit nicely in the box
            doc.addImage(LOGO_BASE64, 'PNG', 16, 12, 47, 18);
        } catch {
            drawLogoText(doc);
        }
    } else {
        drawLogoText(doc);
    }

    // Document info (right side in header)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Cotización N°:', 120, 28);
    doc.setFont('helvetica', 'bold');
    doc.text(data.numero, 195, 28, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.text('Válida hasta:', 120, 35);
    doc.setFont('helvetica', 'bold');
    doc.text(new Date(data.validez).toLocaleDateString('es-CL'), 195, 35, { align: 'right' });

    // ============================================
    // DOCUMENT TITLE - Below header
    // ============================================
    doc.setTextColor(...darkBlue);
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text('COTIZACIÓN', 195, 58, { align: 'right' });

    // ============================================
    // INFO SECTION - Para / De
    // ============================================
    const infoY = 70;
    
    // "Cotización Para:" section
    doc.setTextColor(...green);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Cotización Para:', 15, infoY);
    
    doc.setTextColor(...textDark);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(data.cliente?.razonSocial || data.nombreProspecto || 'Prospecto', 15, infoY + 7);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let clientInfoY = infoY + 13;
    if (data.cliente?.rut) {
        doc.text(`RUT: ${data.cliente.rut}`, 15, clientInfoY);
        clientInfoY += 5;
    }
    doc.text(`Email: ${data.cliente?.email || data.emailProspecto || 'N/A'}`, 15, clientInfoY);

    // "Cotización De:" section
    doc.setTextColor(...green);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Cotización De:', 120, infoY);
    
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
        if (yPos > 220) {
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
    // COMBINED TERMS & BANK INFO SECTION (full width, near footer)
    // ============================================
    const sectionY = 218;
    
    // Full width background
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(220, 225, 230);
    doc.roundedRect(10, sectionY, 190, 42, 2, 2, 'FD');
    
    // Vertical divider line
    doc.setDrawColor(200, 210, 220);
    doc.line(105, sectionY + 5, 105, sectionY + 37);
    
    // Left green accent
    doc.setFillColor(...green);
    doc.rect(10, sectionY, 2, 42, 'F');
    
    // --- LEFT: TERMS SECTION ---
    doc.setTextColor(...green);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Términos y Condiciones', 16, sectionY + 7);
    
    doc.setTextColor(70, 70, 70);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    
    // Two columns of terms
    doc.text('• Validez: 14 días desde emisión', 16, sectionY + 15);
    doc.text('• Precios incluyen IVA', 16, sectionY + 21);
    doc.text('• Entrega: 24 hrs post pago', 16, sectionY + 27);
    doc.text('• Forma de pago: Transferencia', 16, sectionY + 33);
    
    // Custom notes if provided
    if (data.notas) {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        const notesLines = doc.splitTextToSize('Nota: ' + data.notas, 85);
        doc.text(notesLines.slice(0, 1), 16, sectionY + 39);
    }
    
    // --- RIGHT: BANK INFO ---
    doc.setTextColor(...darkBlue);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Datos para Transferencia Bancaria', 110, sectionY + 7);
    
    doc.setFontSize(8);
    doc.setTextColor(...textDark);
    doc.setFont('helvetica', 'bold');
    doc.text('Banco Santander', 110, sectionY + 15);
    
    doc.setFont('helvetica', 'normal');
    doc.text('Cuenta Corriente: 0-000-8814903-3', 110, sectionY + 21);
    doc.text('RUT: 76.732.709-9', 110, sectionY + 27);
    doc.text('Titular: Servicios Informáticos M. Cortés EIRL', 110, sectionY + 33);
    doc.text('Email: contacto@itsdev.cl', 110, sectionY + 39);

    // ============================================
    // FOOTER (at bottom of page)
    // ============================================
    doc.setFillColor(...darkBlue);
    doc.rect(0, 264, 210, 33, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('+56 9 9095 8220', 25, 280);
    doc.text('contacto@itsdev.cl', 85, 280);
    doc.text('Santiago, Chile', 155, 280);

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
