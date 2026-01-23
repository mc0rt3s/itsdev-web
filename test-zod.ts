import { z } from 'zod';
import { clienteSchema } from './src/lib/schemas';

console.log('Testing Zod...');

const validData = {
    rut: '12345678-9',
    razonSocial: 'Empresa Test',
    email: 'test@empresa.com'
};

const result = clienteSchema.safeParse(validData);
console.log('Valid data success:', result.success);

const invalidData = {
    rut: '',
    razonSocial: ''
};

const invalidResult = clienteSchema.safeParse(invalidData);
console.log('Invalid data success:', invalidResult.success);

if (!invalidResult.success) {
    console.log('Error keys:', Object.keys(invalidResult.error));
    console.log('Issues:', (invalidResult.error as any).issues);
    console.log('Errors:', (invalidResult.error as any).errors);
}
