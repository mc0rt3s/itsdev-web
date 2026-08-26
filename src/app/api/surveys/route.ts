import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from 'next-auth/react';

// GET all surveys
export async function GET() {
  try {
    const surveys = await prisma.survey.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        respuestas: {
          select: { id: true, createdAt: true },
        },
      },
    });

    return NextResponse.json(surveys);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching surveys' },
      { status: 500 }
    );
  }
}

// POST create survey
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { titulo, descripcion, activo } = body;

    if (!titulo) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const survey = await prisma.survey.create({
      data: {
        titulo,
        descripcion: descripcion || '',
        activo: activo ?? true,
      },
    });

    return NextResponse.json(survey, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error creating survey' },
      { status: 500 }
    );
  }
}
