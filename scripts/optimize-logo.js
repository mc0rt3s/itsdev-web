/**
 * Script para optimizar logo.png para PDFs
 * Crea una versión más pequeña (240x192) para reducir tamaño del PDF
 * 
 * Uso: node scripts/optimize-logo.js
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

async function optimizeLogo() {
  try {
    const logoPath = path.join(__dirname, '../public/logo.png');
    
    if (!fs.existsSync(logoPath)) {
      console.error('Logo no encontrado en', logoPath);
      process.exit(1);
    }

    // Load image
    const image = await loadImage(logoPath);
    console.log(`✓ Imagen original: ${image.width}x${image.height}`);

    // Create canvas with new size (240x192 mantiene aspect ratio)
    const canvas = createCanvas(240, 192);
    const ctx = canvas.getContext('2d');

    // Draw resized image
    ctx.drawImage(image, 0, 0, 240, 192);

    // Save to file
    const outputPath = path.join(__dirname, '../public/logo-pdf.png');
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);

    const sizeKB = (buffer.length / 1024).toFixed(1);
    console.log(`✓ Logo optimizado guardado: ${outputPath}`);
    console.log(`  Tamaño: ${sizeKB} KB (original: ~76 KB)`);
    console.log(`\nPara usar en PDF, actualiza src/lib/pdf-generator.ts`);
    console.log(`y cambia la búsqueda de 'logo-pdf.png' primero en candidates[]`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

optimizeLogo();
