import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET survey by id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const survey = await prisma.survey.findUnique({
      where: { id },
      include: {
        respuestas: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!survey) {
      return NextResponse.json(
        { error: 'Survey not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(survey);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching survey' },
      { status: 500 }
    );
  }
}

// PATCH update survey
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { titulo, descripcion, activo } = body;

    const survey = await prisma.survey.update({
      where: { id },
      data: {
        ...(titulo && { titulo }),
        ...(descripcion !== undefined && { descripcion }),
        ...(activo !== undefined && { activo }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(survey);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error updating survey' },
      { status: 500 }
    );
  }
}

// DELETE survey
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.survey.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error deleting survey' },
      { status: 500 }
    );
  }
}
