import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import jsPDF from 'jspdf';
import fs from 'fs';
import path from 'path';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

function getMonthRange(month: string) {
    const [year, monthNumber] = month.split('-').map(Number);
    const start = new Date(Date.UTC(year, monthNumber - 1, 1, 0, 0, 0));
    const end = new Date(Date.UTC(year, monthNumber, 1, 0, 0, 0));
    return { start, end };
}

let LOGO_BASE64 = '';
try {
    const candidates = [
        path.join(process.cwd(), 'public', 'logo-transparent.png'),
        path.join(process.cwd(), 'public', 'logo-dark.png'),
        path.join(process.cwd(), 'public', 'logo-pdf.png'),
    ];
    const selected = candidates.find((candidate) => fs.existsSync(candidate));
    if (selected) {
        const logoBuffer = fs.readFileSync(selected);
        LOGO_BASE64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    }
} catch {
    console.warn('Logo ITSDev no disponible para informe mensual');
}

function buildMonthlyReportPDF(params: {
    cliente: string;
    monthLabel: string;
    totalInteracciones: number;
    totalMinutos: number;
    pendientes: number;
    items: Array<{
        fecha: Date;
        tipo: string;
        resumen: string;
        duracionMin: number | null;
        estadoSeguimiento: string | null;
        objetivo?: string | null;
        proximoPaso?: string | null;
    }>;
}) {
    const doc = new jsPDF();
    const fmtDate = (date: Date) => new Date(date).toLocaleDateString('es-CL');
    const palette = {
        navy: [24, 39, 58] as [number, number, number],
        green: [133, 186, 57] as [number, number, number],
        text: [15, 23, 42] as [number, number, number],
        muted: [71, 85, 105] as [number, number, number],
        line: [226, 232, 240] as [number, number, number],
        panel: [247, 249, 252] as [number, number, number],
        white: [255, 255, 255] as [number, number, number],
    };

    const pageWidth = 210;
    const tableX = 14;
    const tableW = 182;
    const colDate = 24;
    const colType = 22;
    const colResumen = 88;
    const colMin = 16;
    const colEstado = 32;

    doc.setFillColor(...palette.navy);
    doc.rect(0, 0, pageWidth, 36, 'F');
    doc.setFillColor(...palette.green);
    doc.rect(0, 0, pageWidth, 4, 'F');

    if (LOGO_BASE64) {
        try {
            doc.addImage(LOGO_BASE64, 'PNG', 14, 8, 54, 15);
        } catch {
            drawReportWordmark(doc, 14, 17, palette);
        }
    } else {
        drawReportWordmark(doc, 14, 17, palette);
    }

    doc.setTextColor(...palette.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('INFORME MENSUAL', 194, 14, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(params.monthLabel, 194, 21, { align: 'right' });
    doc.text(params.cliente, 194, 27, { align: 'right' });

    doc.setTextColor(...palette.text);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(21);
    doc.text('Comunicaciones', 14, 50);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...palette.muted);
    doc.text('Resumen operativo mensual de atenciones y seguimientos', 14, 56);

    const cardsY = 64;
    const cardW = 56;
    const gap = 7;
    const cards = [
        { label: 'Interacciones', value: String(params.totalInteracciones) },
        { label: 'Tiempo Registrado', value: `${params.totalMinutos} min` },
        { label: 'Pendientes', value: String(params.pendientes) },
    ];
    cards.forEach((card, index) => {
        const x = 14 + index * (cardW + gap);
        doc.setFillColor(...palette.panel);
        doc.roundedRect(x, cardsY, cardW, 22, 2, 2, 'F');
        doc.setTextColor(...palette.green);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(card.label.toUpperCase(), x + 4, cardsY + 6);
        doc.setTextColor(...palette.text);
        doc.setFontSize(14);
        doc.text(card.value, x + 4, cardsY + 15);
    });

    let y = 96;
    const drawTableHeader = (top: number) => {
        doc.setFillColor(...palette.navy);
        doc.rect(tableX, top, tableW, 9, 'F');
        doc.setTextColor(...palette.white);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.2);
        let x = tableX;
        doc.text('Fecha', x + 3, top + 6);
        x += colDate;
        doc.text('Tipo', x + 3, top + 6);
        x += colType;
        doc.text('Resumen / Gestion', x + 3, top + 6);
        x += colResumen;
        doc.text('Min', x + colMin - 2, top + 6, { align: 'right' });
        x += colMin;
        doc.text('Estado', x + colEstado - 2, top + 6, { align: 'right' });
    };
    drawTableHeader(y);
    y += 11;

    for (const item of params.items) {
        const resumenParts = [
            item.resumen,
            item.objetivo ? `Obj: ${item.objetivo}` : '',
            item.proximoPaso ? `Sig: ${item.proximoPaso}` : '',
        ].filter(Boolean).join(' | ');
        const resumenLines = doc.splitTextToSize(resumenParts, colResumen - 6);
        const rowHeight = Math.max(8, resumenLines.length * 4.8 + 2);

        if (y + rowHeight > 274) {
            doc.addPage();
            y = 18;
            drawTableHeader(y);
            y += 11;
        }

        doc.setTextColor(...palette.text);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        let x = tableX;
        doc.text(fmtDate(item.fecha), x + 3, y + 5.5);
        x += colDate;
        doc.text(item.tipo, x + 3, y + 5.5);
        x += colType;
        doc.text(resumenLines, x + 3, y + 4.5);
        x += colResumen;
        doc.text(String(item.duracionMin || 0), x + colMin - 2, y + 5.5, { align: 'right' });
        x += colMin;
        doc.text(item.estadoSeguimiento || '-', x + colEstado - 2, y + 5.5, { align: 'right' });
        doc.setDrawColor(...palette.line);
        doc.line(tableX, y + rowHeight, tableX + tableW, y + rowHeight);
        y += rowHeight + 2;
    }

    doc.setFillColor(...palette.navy);
    doc.rect(0, 285, pageWidth, 12, 'F');
    doc.setTextColor(...palette.white);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('ITSDev · Informes de comunicaciones y seguimiento comercial', 14, 292);
    doc.text(`Generado ${new Date().toLocaleString('es-CL')}`, 196, 292, { align: 'right' });

    return Buffer.from(doc.output('arraybuffer'));
}

function drawReportWordmark(
    doc: jsPDF,
    x: number,
    y: number,
    palette: { white: [number, number, number] }
) {
    doc.setTextColor(...palette.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('ITSDev', x, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('IT Specialists', x, y + 4.5);
}

async function getReportData(clienteId: string, month: string) {
    const { start, end } = getMonthRange(month);
    const cliente = await prisma.cliente.findUnique({
        where: { id: clienteId },
        select: { id: true, razonSocial: true, email: true }
    });

    if (!cliente) return null;

    const items = await prisma.comunicacion.findMany({
        where: {
            clienteId,
            fecha: {
                gte: start,
                lt: end
            }
        },
        select: {
            id: true,
            fecha: true,
            tipo: true,
            resumen: true,
            duracionMin: true,
            estadoSeguimiento: true,
            objetivo: true,
            proximoPaso: true,
        },
        orderBy: { fecha: 'asc' }
    });

    const totalInteracciones = items.length;
    const totalMinutos = items.reduce((sum, item) => sum + (item.duracionMin || 0), 0);
    const pendientes = items.filter((item) => item.estadoSeguimiento && item.estadoSeguimiento !== 'cerrado').length;

    return {
        cliente,
        items,
        totalInteracciones,
        totalMinutos,
        pendientes
    };
}

export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const clienteId = request.nextUrl.searchParams.get('clienteId');
    const month = request.nextUrl.searchParams.get('month');
    const format = request.nextUrl.searchParams.get('format');
    if (!clienteId || !month) {
        return NextResponse.json({ error: 'clienteId y month son requeridos' }, { status: 400 });
    }

    const report = await getReportData(clienteId, month);
    if (!report) {
        return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const monthLabel = new Date(`${month}-01T00:00:00Z`).toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'long'
    });

    if (format === 'pdf') {
        const pdf = buildMonthlyReportPDF({
            cliente: report.cliente.razonSocial,
            monthLabel,
            totalInteracciones: report.totalInteracciones,
            totalMinutos: report.totalMinutos,
            pendientes: report.pendientes,
            items: report.items
        });

        return new NextResponse(new Uint8Array(pdf), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="Informe-Comunicaciones-${report.cliente.razonSocial.replace(/\s+/g, '-')}-${month}.pdf"`,
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                Pragma: 'no-cache',
                Expires: '0'
            }
        });
    }

    return NextResponse.json({
        cliente: report.cliente,
        monthLabel,
        totalInteracciones: report.totalInteracciones,
        totalMinutos: report.totalMinutos,
        pendientes: report.pendientes,
        items: report.items
    });
}

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await request.json();
    const clienteId = body?.clienteId as string | undefined;
    const month = body?.month as string | undefined;
    const destinatario = (body?.destinatario as string | undefined)?.trim();

    if (!clienteId || !month) {
        return NextResponse.json({ error: 'clienteId y month son requeridos' }, { status: 400 });
    }

    const report = await getReportData(clienteId, month);
    if (!report) {
        return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const to = destinatario || report.cliente.email;
    if (!to) {
        return NextResponse.json({ error: 'No hay destinatario disponible' }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'RESEND_API_KEY no configurada' }, { status: 500 });
    }

    const monthLabel = new Date(`${month}-01T00:00:00Z`).toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'long'
    });
    const pdf = buildMonthlyReportPDF({
        cliente: report.cliente.razonSocial,
        monthLabel,
        totalInteracciones: report.totalInteracciones,
        totalMinutos: report.totalMinutos,
        pendientes: report.pendientes,
        items: report.items
    });

    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
        from: 'ITSDev Informes <noreply@sender.itsdev.cl>',
        to: [to],
        replyTo: 'contacto@itsdev.cl',
        subject: `Informe mensual de comunicaciones - ${report.cliente.razonSocial} (${monthLabel})`,
        html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a;">
        <h2 style="margin-bottom: 10px;">Informe mensual de comunicaciones</h2>
        <p><strong>Cliente:</strong> ${report.cliente.razonSocial}</p>
        <p><strong>Periodo:</strong> ${monthLabel}</p>
        <p><strong>Interacciones:</strong> ${report.totalInteracciones}</p>
        <p><strong>Minutos registrados:</strong> ${report.totalMinutos}</p>
        <p><strong>Pendientes:</strong> ${report.pendientes}</p>
      </div>
    `,
        attachments: [
            {
                filename: `Informe-Comunicaciones-${report.cliente.razonSocial.replace(/\s+/g, '-')}-${month}.pdf`,
                content: pdf
            }
        ]
    });

    if (error) {
        return NextResponse.json({ error: error.message || 'Error al enviar informe' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, emailId: data?.id, destinatario: to });
}
