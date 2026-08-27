import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST submit survey response (público - sin auth)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { pregunta1, pregunta2, pregunta3, pregunta4, pregunta5 } = body;

    // Validar que survey exista y esté activo
    const survey = await prisma.survey.findUnique({
      where: { id },
    });

    if (!survey) {
      return NextResponse.json(
        { error: 'Survey not found' },
        { status: 404 }
      );
    }

    if (!survey.activo) {
      return NextResponse.json(
        { error: 'Survey is no longer active' },
        { status: 410 }
      );
    }

    // Crear respuesta
    const response = await prisma.surveyResponse.create({
      data: {
        surveyId: id,
        pregunta1: pregunta1 || null,
        pregunta2: pregunta2 || null,
        pregunta3: pregunta3 || null,
        pregunta4: pregunta4 || null,
        pregunta5: pregunta5 || null,
      },
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating survey response:', error);
    return NextResponse.json(
      { error: 'Error saving response' },
      { status: 500 }
    );
  }
}
