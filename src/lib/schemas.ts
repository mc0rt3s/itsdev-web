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


export const notaSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido'),
  contenido: z.string().min(1, 'El contenido es requerido'),
  favorita: z.boolean().default(false),
  color: z.enum(['slate', 'cyan', 'violet', 'emerald', 'amber', 'rose']).default('slate'),
});

export type NotaInput = z.infer<typeof notaSchema>;

export const accesoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  tipo: z.string().min(1, 'El tipo es requerido'),
  url: z.string().url('URL inválida').optional().nullable().or(z.literal('')),
  puerto: z.string().optional().nullable(),
  usuario: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
  clienteId: z.string().optional().nullable(),
});


export const contactSchema = z.object({
  nombre: z.string().min(2, 'El nombre es requerido (mínimo 2 caracteres)'),
  empresa: z.string().optional().nullable(),
  email: z.string().email('Email inválido'),
  telefono: z.string().optional().nullable(),
  mensaje: z.string().min(10, 'El mensaje es requerido (mínimo 10 caracteres)'),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const enlaceSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  url: z.string().url('URL inválida'),
  categoria: z.enum(['infraestructura', 'monitoreo', 'desarrollo', 'documentacion', 'otros']).default('otros'),
  descripcion: z.string().optional().nullable(),
  icono: z.enum(['link', 'server', 'shield', 'cloud', 'code', 'database', 'monitor', 'folder']).default('link'),
  orden: z.number().int().default(0),
  activo: z.boolean().default(true),
});

export type EnlaceInput = z.infer<typeof enlaceSchema>;
