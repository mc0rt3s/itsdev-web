import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 });
        }

        // Validar tipo de archivo (solo imágenes)
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Tipo de archivo no válido. Solo se permiten imágenes (JPG, PNG, WEBP) o PDF' }, { status: 400 });
        }

        // Validar tamaño (máximo 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return NextResponse.json({ error: 'El archivo es demasiado grande. Máximo 5MB' }, { status: 400 });
        }

        // Generar nombre único para el archivo
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 9);
        const extension = file.name.split('.').pop();
        const fileName = `comprobante_${timestamp}_${randomStr}.${extension}`;

        // Ruta donde se guardará el archivo
        const uploadsDir = join(process.cwd(), 'public', 'uploads', 'comprobantes');
        
        // Asegurar que el directorio existe
        await mkdir(uploadsDir, { recursive: true });

        // Leer el archivo como buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Guardar el archivo
        const filePath = join(uploadsDir, fileName);
        await writeFile(filePath, buffer);

        // Retornar la ruta relativa para guardar en la BD
        const relativePath = `/uploads/comprobantes/${fileName}`;

        return NextResponse.json({ 
            success: true, 
            path: relativePath,
            fileName: fileName
        });
    } catch (error: any) {
        console.error('Error al subir archivo:', error);
        return NextResponse.json({ error: 'Error al subir el archivo' }, { status: 500 });
    }
}
