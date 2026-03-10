import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import jsPDF from 'jspdf';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

function getMonthRange(month: string) {
    const [year, monthNumber] = month.split('-').map(Number);
    const start = new Date(Date.UTC(year, monthNumber - 1, 1, 0, 0, 0));
    const end = new Date(Date.UTC(year, monthNumber, 1, 0, 0, 0));
    return { start, end };
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
    }>;
}) {
    const doc = new jsPDF();
    const fmtDate = (date: Date) => new Date(date).toLocaleDateString('es-CL');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Informe Mensual de Comunicaciones', 14, 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Cliente: ${params.cliente}`, 14, 24);
    doc.text(`Periodo: ${params.monthLabel}`, 14, 30);

    doc.setFont('helvetica', 'bold');
    doc.text(`Interacciones: ${params.totalInteracciones}`, 14, 40);
    doc.text(`Tiempo registrado: ${params.totalMinutos} min`, 14, 46);
    doc.text(`Seguimientos pendientes: ${params.pendientes}`, 14, 52);

    let y = 64;
    doc.setFontSize(9);
    doc.setFillColor(30, 41, 59);
    doc.rect(14, y, 182, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text('Fecha', 18, y + 5.5);
    doc.text('Tipo', 42, y + 5.5);
    doc.text('Resumen', 66, y + 5.5);
    doc.text('Min', 172, y + 5.5);
    doc.text('Estado', 183, y + 5.5);
    y += 10;

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');

    for (const item of params.items) {
        if (y > 270) {
            doc.addPage();
            y = 16;
        }
        const resumen = doc.splitTextToSize(item.resumen, 95)[0] || '';
        doc.text(fmtDate(item.fecha), 18, y);
        doc.text(item.tipo, 42, y);
        doc.text(resumen, 66, y);
        doc.text(String(item.duracionMin || 0), 172, y, { align: 'right' });
        doc.text(item.estadoSeguimiento || '-', 183, y);
        y += 7;
    }

    return Buffer.from(doc.output('arraybuffer'));
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
            estadoSeguimiento: true
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
    if (!clienteId || !month) {
        return NextResponse.json({ error: 'clienteId y month son requeridos' }, { status: 400 });
    }

    const report = await getReportData(clienteId, month);
    if (!report) {
        return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
        cliente: report.cliente,
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
