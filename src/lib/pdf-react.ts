/**
 * Renderizador de PDFs con react-pdf
 * Convierte componentes React PDF a Buffer
 */

import { renderToStream } from '@react-pdf/renderer';
import fs from 'fs';
import path from 'path';

/**
 * Renderiza un componente React PDF a Buffer
 * @param component - Componente ReactElement de react-pdf
 * @returns Promise<Buffer> - PDF como buffer
 */
export async function renderPDFToBuffer(component: React.ReactElement): Promise<Buffer> {
  const stream = await renderToStream(component);

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    stream.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    stream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    stream.on('error', reject);
  });
}

/**
 * Carga logo desde public/ y retorna como base64
 * @returns string - Data URL del logo o string vacío si no existe
 */
export function loadLogoBase64(): string {
  try {
    const candidates = [
      path.join(process.cwd(), 'public', 'logo-transparent.png'),
      path.join(process.cwd(), 'public', 'logo-dark.png'),
      path.join(process.cwd(), 'public', 'logo-pdf.png'),
    ];

    const selected = candidates.find((candidate) => fs.existsSync(candidate));
    if (selected) {
      const logoBuffer = fs.readFileSync(selected);
      return `data:image/png;base64,${logoBuffer.toString('base64')}`;
    }
  } catch (error) {
    console.warn('Error loading logo:', error);
  }

  return '';
}
