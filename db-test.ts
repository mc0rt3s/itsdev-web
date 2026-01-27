import { prisma } from './src/lib/prisma';

async function main() {
    try {
        console.log('Testing database connection...');
        const notas = await prisma.nota.findMany({
            take: 1
        });
        console.log('Successfully queried Nota table:', notas);

        // Check if new models are accessible
        const servicios = await prisma.servicio.count();
        console.log('Servicios count:', servicios);

    } catch (error) {
        console.error('Database Error:', error);
        process.exit(1);
    }
}

main();
