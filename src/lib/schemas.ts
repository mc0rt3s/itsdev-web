import { z } from 'zod';

export const clienteSchema = z.object({
  rut: z.string().min(1, 'El RUT es requerido'),
  razonSocial: z.string().min(1, 'La razón social es requerida'),
  contacto: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable(),
  notas: z.string().optional().nullable(),
  estado: z.enum(['activo', 'inactivo', 'prospecto']).default('activo'),
});

export type ClienteInput = z.infer<typeof clienteSchema>;

export const userSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.enum(['admin', 'user']).default('user'),
});

export type UserInput = z.infer<typeof userSchema>;
